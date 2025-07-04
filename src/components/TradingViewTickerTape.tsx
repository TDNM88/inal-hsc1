'use client';

import { useEffect, useRef, useState, memo } from "react";

const TradingViewTickerTape = memo(function TradingViewTickerTape() {
  const container = useRef<HTMLDivElement>(null);
  const [symbolCount, setSymbolCount] = useState(10); // Default symbol count
  const [isLoaded, setIsLoaded] = useState(false);

  // List of symbols to display
  const allSymbols = [
    { proName: "FX_IDC:EURUSD", title: "EUR/USD" },
    { proName: "BITSTAMP:BTCUSD", title: "BTC/USD" },
    { proName: "BITSTAMP:ETHUSD", title: "ETH/USD" },
    { description: "APPLE", proName: "NASDAQ:AAPL" },
    { description: "AMAZON", proName: "NASDAQ:AMZN" },
    { description: "VN30", proName: "HOSE:VN30" },
    { description: "VN INDEX", proName: "HOSE:VNINDEX" },
    { description: "FPT", proName: "HOSE:FPT" },
    { description: "MBB", proName: "HOSE:MBB" },
    { description: "TCB", proName: "HOSE:TCB" },
  ];

  useEffect(() => {
    // Determine how many symbols to show based on window width
    const updateSymbolCount = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setSymbolCount(2); // Small mobile: show minimum
      } else if (width < 640) {
        setSymbolCount(3); // Mobile: show fewer symbols
      } else if (width < 1024) {
        setSymbolCount(5); // Tablet
      } else {
        setSymbolCount(10); // Desktop
      }
    };

    // Initial count
    updateSymbolCount();

    // Update on resize with debounce to avoid excessive reloads
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateSymbolCount();
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  useEffect(() => {
    if (!container.current) return;
    setIsLoaded(false);

    // Clear any existing content
    while (container.current.firstChild) {
      container.current.removeChild(container.current.firstChild);
    }

    // Create and configure the script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: allSymbols.slice(0, symbolCount), // Limit symbols based on screen size
      showSymbolLogo: true,
      colorTheme: "light",
      isTransparent: false,
      displayMode: "adaptive",
      locale: "vi_VN",
    });

    // Show loading state is complete when script loads
    script.onload = () => {
      setIsLoaded(true);
    };

    // Append the script to the container
    container.current.appendChild(script);

    return () => {
      // Cleanup
      if (container.current) {
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
    };
  }, [symbolCount]); // Re-render when symbolCount changes

  return (
    <div className="w-full overflow-hidden">
      {!isLoaded && (
        <div className="h-10 bg-gray-100 animate-pulse w-full rounded" />
      )}
      <div 
        ref={container} 
        className={`tradingview-widget-container w-full ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ 
          height: "46px",
          marginBottom: "8px"
        }}
      >
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
});

export default TradingViewTickerTape;
