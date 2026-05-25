import React, { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
};

export const LiveViewer = ({ streamId }: { streamId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Đang kết nối đến luồng trực tiếp...');
  
  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    let viewerDocRef: any = null;
    let unsubViewerDoc: any = null;
    let unsubBroadcasterIce: any = null;
    let unsubViewerIce: any = null; // actually doesn't need unsub but for cleanup

    const initViewer = async () => {
      try {
        console.log("Setting up RTCPeerConnection for viewer");
        pc = new RTCPeerConnection(servers);
        
        // We want to receive video and audio
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
        
        pc.ontrack = (event) => {
          console.log("Received track", event.streams);
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setStatus('');
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc?.iceConnectionState === 'disconnected' || pc?.iceConnectionState === 'failed') {
            setStatus('Luồng trực tiếp đã kết thúc hoặc mất kết nối.');
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Save offer to Firestore to signal the broadcaster
        viewerDocRef = doc(collection(db, 'streams', streamId, 'viewers'));
        await setDoc(viewerDocRef, { offer: { type: offer.type, sdp: offer.sdp } });

        // Listen for the broadcaster's answer
        unsubViewerDoc = onSnapshot(viewerDocRef, (snapshot: any) => {
          const data = snapshot.data();
          if (data && data.answer && !pc?.currentRemoteDescription) {
            console.log("Received answer from broadcaster");
            const rtcAnswer = new RTCSessionDescription(data.answer);
            pc?.setRemoteDescription(rtcAnswer).catch(console.error);
          }
        });

        // Listen for ice candidates from the broadcaster
        unsubBroadcasterIce = onSnapshot(collection(db, 'streams', streamId, 'viewers', viewerDocRef.id, 'broadcasterIce'), (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            if (change.type === 'added') {
              console.log("Received ICE candidate from broadcaster");
              const candidate = new RTCIceCandidate(change.doc.data());
              pc?.addIceCandidate(candidate).catch(console.error);
            }
          });
        });

        // Send our ice candidates to the broadcaster
        pc.onicecandidate = (event) => {
          if (event.candidate && viewerDocRef) {
            addDoc(collection(db, 'streams', streamId, 'viewers', viewerDocRef.id, 'viewerIce'), event.candidate.toJSON()).catch(console.error);
          }
        };

      } catch (e: any) {
        console.error("Error setting up viewer: ", e);
        setStatus('Không thể tải luồng trực tiếp. Lỗi: ' + (e?.message || JSON.stringify(e)));
      }
    };

    initViewer();

    return () => {
      console.log("Cleaning up live viewer");
      if (pc) pc.close();
      if (unsubViewerDoc) unsubViewerDoc();
      if (unsubBroadcasterIce) unsubBroadcasterIce();
      if (viewerDocRef) {
        deleteDoc(viewerDocRef).catch(console.error); // tell broadcaster we left
      }
    };
  }, [streamId]);

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center">
      {status && (
        <div className="absolute inset-0 flex items-center justify-center z-10 p-4 text-center bg-black/60 backdrop-blur-sm">
          <p className="text-white font-medium text-lg">{status}</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export const LiveBroadcaster = ({ streamId, liveSource }: { streamId: string, liveSource: 'camera' | 'screen' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of unsubs to clean up nicely
  const unsubs = useRef<Record<string, { viewerIce?: any }>>({});
  let unsubViewers: any = null;

  const startStream = async () => {
    try {
      console.log("Starting stream from ", liveSource);
      let stream: MediaStream;
      if (liveSource === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      setError(null);

      // Clean up old viewers first if starting fresh
      const viewersColl = collection(db, 'streams', streamId, 'viewers');
      try {
        const existingDocs = await getDocs(viewersColl);
        existingDocs.forEach(d => deleteDoc(d.ref));
      } catch (e) {
        console.log("Could not drop old viewers, continuing anyway", e);
      }

      // Listen for viewers asking to join
      unsubViewers = onSnapshot(collection(db, 'streams', streamId, 'viewers'), (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const viewerId = change.doc.id;
          
          if (change.type === 'added') {
            const data = change.doc.data();
            if (!data.offer) return;
            
            console.log("New viewer joined: ", viewerId);
            const pc = new RTCPeerConnection(servers);
            peerConnections.current[viewerId] = pc;
            unsubs.current[viewerId] = {};
            
            // Add the local stream to the peer connection
            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
            });
            
            // Set remote description from viewer's offer
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            
            // Create our answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            // Send answer back
            await updateDoc(change.doc.ref, { answer: { type: answer.type, sdp: answer.sdp } });
            
            // Send our ICE candidates to viewer
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                addDoc(collection(db, 'streams', streamId, 'viewers', viewerId, 'broadcasterIce'), event.candidate.toJSON()).catch(console.error);
              }
            };
            
            // Listen for ICE candidates from viewer
            const unsubViewerIce = onSnapshot(
              collection(db, 'streams', streamId, 'viewers', viewerId, 'viewerIce'), 
              (snap) => {
                snap.docChanges().forEach(c => {
                  if (c.type === 'added') {
                    console.log("Received ICE candidate from viewer ", viewerId);
                    const candidate = new RTCIceCandidate(c.doc.data());
                    pc.addIceCandidate(candidate).catch(console.error);
                  }
                });
              }
            );
            unsubs.current[viewerId].viewerIce = unsubViewerIce;

          } else if (change.type === 'removed') {
            console.log("Viewer left: ", viewerId);
            if (peerConnections.current[viewerId]) {
              peerConnections.current[viewerId].close();
              delete peerConnections.current[viewerId];
            }
            if (unsubs.current[viewerId] && unsubs.current[viewerId].viewerIce) {
              unsubs.current[viewerId].viewerIce();
            }
            delete unsubs.current[viewerId];
          }
        });
      });

    } catch (e: any) {
      console.error("Error starting stream", e);
      setError("Không thể cấp quyền truy cập Camera/Âm thanh hoặc Màn hình.");
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    return () => {
      console.log("Cleaning up broadcaster");
      if (unsubViewers) unsubViewers();
      
      // Close all peer connections
      Object.values(peerConnections.current).forEach(pc => pc.close());
      
      // Unsubscribe all inner listeners
      Object.values(unsubs.current).forEach(u => {
        if (u.viewerIce) u.viewerIce();
      });

      // Stop camera/screen
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative bg-slate-900 group">
      {!isStreaming ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center bg-black/40">
          <button 
            onClick={startStream}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            Bắt đầu Phát Trực Tiếp
          </button>
          {error && <p className="text-red-400 mt-4 text-sm max-w-sm">{error}</p>}
        </div>
      ) : (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          ĐANG PHÁT TRỰC TIẾP
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Muted for broadcaster to avoid feedback loop
        className="w-full h-full object-contain"
      />
    </div>
  );
};
