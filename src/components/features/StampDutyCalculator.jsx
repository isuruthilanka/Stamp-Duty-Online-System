import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';

const StampDutyCalculator = () => {
    const iframeRef = useRef(null);
    const { setCalculatorData } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();

    // Check if we came from an application context
    const appId = location.state?.appId;
    const permFileNo = location.state?.permFileNo;
    const category = location.state?.category; // OP, FI, RT

    useEffect(() => {
        const handleMessage = (event) => {
            console.log('Got message:', event.data?.type);
            if (event.data && event.data.type === 'STAMP_DUTY_CALCULATION') {
                console.log('Received calculation:', event.data.data);
                setCalculatorData(event.data.data);
            } else if (event.data && event.data.type === 'APPLY_RESULTS') {
                console.log('Applying results to Opinion Form:', event.data.data);
                setCalculatorData(event.data.data);

                // If we know which application we are assessing, automatically redirect to its next step
                if (appId) {
                    if (category === 'FI' || category === 'RT') {
                        // Redirect FI/RT directly to deficiency calculator, passing computed value & duty
                        navigate(`/internal/deficiency-calculator`, {
                            state: {
                                appId,
                                permFileNo,
                                category,
                                calculatedValue: event.data.data.marketValue,
                                calculatedDuty: event.data.data.dutyAmount
                            }
                        });
                    } else {
                        // Default OP behavior: go to opinion form
                        navigate(`/internal/view/${appId}/opinion`);
                    }
                } else {
                    alert('Calculation saved. Please return to the application to continue.');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setCalculatorData, appId, navigate]);

    // Send the pre-filled data to the calculator iframe once it loads
    const handleIframeLoad = () => {
        if (permFileNo && iframeRef.current) {
            iframeRef.current.contentWindow.postMessage({
                type: 'SET_FILE_NUMBER',
                fileNumber: permFileNo
            }, '*');
        }
    };

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 100px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e1e5eb' }}>
            <iframe
                ref={iframeRef}
                src="/comprehensive-calculator.html"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Comprehensive Stamp Duty Calculator"
                onLoad={handleIframeLoad}
            />
        </div>
    );
};

export default StampDutyCalculator;
