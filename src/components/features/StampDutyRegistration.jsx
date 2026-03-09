import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';

const StampDutyRegistration = () => {
    const { applications } = useAppContext();
    const iframeRef = useRef(null);

    useEffect(() => {
        const syncDataToIframe = () => {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentWindow && applications) {
                iframe.contentWindow.postMessage({
                    type: 'SYNC_APPLICATIONS',
                    applications: applications
                }, '*');
            }
        };

        // Try syncing when applications change
        syncDataToIframe();

        // Also add load listener to sync after iframe loads
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', syncDataToIframe);
            return () => iframe.removeEventListener('load', syncDataToIframe);
        }
    }, [applications]);

    return (
        <div style={{ height: 'calc(100vh - 4rem)', width: '100%', overflow: 'hidden' }}>
            <iframe
                ref={iframeRef}
                src="/stamp-duty-registration.html"
                title="Stamp Duty Registration System"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    background: '#f8fafc'
                }}
            />
        </div>
    );
};

export default StampDutyRegistration;
