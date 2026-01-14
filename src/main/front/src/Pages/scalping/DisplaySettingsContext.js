import React, { createContext, useContext, useState } from 'react';

const DisplaySettingsContext = createContext(null);

export function DisplaySettingsProvider({ children }) {
    const [displaySettings, setDisplaySettings] = useState({
        showSellTimes: true,
        showBuyCount: true,
        showStopLoss: true,
        showCondition: true,
        showSellPrices: true,
    });

    const value = {
        displaySettings,
        setDisplaySettings
    };

    return (
        <DisplaySettingsContext.Provider value={value}>
            {children}
        </DisplaySettingsContext.Provider>
    );
}

export function useDisplaySettings() {
    const context = useContext(DisplaySettingsContext);
    if (context === null) {
        throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
    }
    return context;
}