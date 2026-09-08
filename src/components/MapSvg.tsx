import React from 'react';
import type { MapLayer, MapOrientation, ViewportState, TileClipWindow } from '../types/map';
import { TileMapLayer } from './TileMapLayer';
import { LottieLoader } from './LottieLoader';

interface MapSvgProps {
  item: MapLayer;
  orientation: MapOrientation;
  viewport?: ViewportState;
  className?: string;
  onLoadingChange?: (isLoading: boolean) => void;
  onBaseLoaded?: () => void;
  hideLoader?: boolean;
  clipWindow?: TileClipWindow;
}

export const MapSvg: React.FC<MapSvgProps> = ({
  item,
  orientation,
  viewport,
  className = '',
  onLoadingChange,
  onBaseLoaded,
  hideLoader = false,
  clipWindow,
}) => {
  // If QuadTree tiling is available, render TileMapLayer for instant load and progressive zoom
  if (item.tilePath) {
    return (
      <TileMapLayer
        key={item.tilePath}
        tilePath={item.tilePath}
        title={item.title}
        orientation={orientation}
        viewport={viewport}
        className={className}
        onLoadingChange={onLoadingChange}
        onBaseLoaded={onBaseLoaded}
        hideLoader={hideLoader}
        clipWindow={clipWindow}
      />
    );
  }

  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      onLoadingChange?.(false);
      onBaseLoaded?.();
    } else {
      setIsLoaded(false);
      onLoadingChange?.(true);
    }
  }, [item.imageUrl, onLoadingChange, onBaseLoaded]);

  if (item.imageUrl) {
    return (
      <div className={`w-full h-full relative overflow-hidden bg-[#1a1d26] select-none flex items-center justify-center ${className}`}>
        {/* Loading placeholder spinner so user never sees a stale previous map */}
        {!isLoaded && !hideLoader && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161822]/90 z-10 select-none pointer-events-none">
            <LottieLoader size={60} text="载入高精度地图中..." />
          </div>
        )}
        <img
          ref={imgRef}
          key={item.imageUrl}
          src={item.imageUrl}
          alt={item.title}
          onLoad={() => {
            setIsLoaded(true);
            onBaseLoaded?.();
          }}
          className={`w-full h-full object-contain pointer-events-none select-none block map-image-layer transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  const isHorizontal = orientation === 'horizontal';
  const width = isHorizontal ? 1200 : 900;
  const height = isHorizontal ? 900 : 1200;
  const viewBox = `0 0 ${width} ${height}`;

  React.useEffect(() => {
    if (!item.tilePath && !item.imageUrl) {
      onLoadingChange?.(false);
    }
  }, [item.tilePath, item.imageUrl, onLoadingChange]);


  // Theme palettes based on category
  const getTheme = () => {
    switch (item.category) {
      case 'antique':
        return {
          seaBg: '#f2e7cb',
          landBg: '#e6d5b0',
          landBorder: '#5a4632',
          provinceBorder: '#8c7355',
          river: '#4d6e75',
          textColor: '#3d2c1d',
          accent: '#b83b28',
          graticule: 'rgba(100, 75, 45, 0.15)',
          paperTexture: true,
          fontFamily: '"STKaiti", "KaiTi", "Songti SC", serif',
        };
      case 'landscape':
        return {
          seaBg: '#092429',
          landBg: '#134e43',
          landBorder: '#c6a858',
          provinceBorder: 'rgba(198, 168, 88, 0.4)',
          river: '#38bdf8',
          textColor: '#f1ebd8',
          accent: '#eab308',
          graticule: 'rgba(198, 168, 88, 0.15)',
          paperTexture: false,
          fontFamily: '"STSong", "Songti SC", "SimSun", serif',
        };
      case 'lithograph':
        return {
          seaBg: '#f3ede1',
          landBg: '#fbf9f4',
          landBorder: '#1e3a5f',
          provinceBorder: '#76889c',
          river: '#2563eb',
          textColor: '#1e293b',
          accent: '#b91c1c',
          graticule: 'rgba(30, 58, 95, 0.2)',
          paperTexture: true,
          fontFamily: '"SimSun", "Songti SC", "Times New Roman", serif',
        };
      case 'relief':
        return {
          seaBg: '#0f2744',
          landBg: 'url(#reliefLandGrad)',
          landBorder: '#334155',
          provinceBorder: 'rgba(255, 255, 255, 0.22)',
          river: '#38bdf8',
          textColor: '#f8fafc',
          accent: '#f59e0b',
          graticule: 'rgba(255, 255, 255, 0.1)',
          paperTexture: false,
          fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        };
      case 'night':
        return {
          seaBg: '#04060a',
          landBg: '#0a0e17',
          landBorder: '#273449',
          provinceBorder: 'rgba(255, 255, 255, 0.08)',
          river: '#1e3a8a',
          textColor: '#e2e8f0',
          accent: '#fbbf24',
          graticule: 'rgba(255, 255, 255, 0.05)',
          paperTexture: false,
          fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        };
      case 'minimal':
        return {
          seaBg: '#f8fafc',
          landBg: '#ffffff',
          landBorder: '#09090b',
          provinceBorder: '#cbd5e1',
          river: '#64748b',
          textColor: '#09090b',
          accent: '#e11d48',
          graticule: 'rgba(0, 0, 0, 0.06)',
          paperTexture: false,
          fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        };
      case 'nautical':
        return {
          seaBg: '#dfd7c2',
          landBg: '#ebe3d0',
          landBorder: '#423425',
          provinceBorder: '#8a7761',
          river: '#3b6e79',
          textColor: '#2e2114',
          accent: '#991b1b',
          graticule: 'rgba(66, 52, 37, 0.18)',
          paperTexture: true,
          fontFamily: '"STKaiti", "KaiTi", "Songti SC", serif',
        };
      case 'river':
        return {
          seaBg: '#e0f2fe',
          landBg: '#f8fafc',
          landBorder: '#334155',
          provinceBorder: '#cbd5e1',
          river: '#0284c7',
          textColor: '#0f172a',
          accent: '#0369a1',
          graticule: 'rgba(2, 132, 199, 0.12)',
          paperTexture: false,
          fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        };
      case 'gold':
        return {
          seaBg: '#050608',
          landBg: '#0e1017',
          landBorder: '#f59e0b',
          provinceBorder: 'rgba(245, 158, 11, 0.3)',
          river: '#fbbf24',
          textColor: '#fef3c7',
          accent: '#ef4444',
          graticule: 'rgba(245, 158, 11, 0.12)',
          paperTexture: false,
          fontFamily: '"STSong", "Songti SC", serif',
        };
      case 'standard':
      default:
        return {
          seaBg: '#e0f2fe',
          landBg: '#fdfbf7',
          landBorder: '#1e293b',
          provinceBorder: '#94a3b8',
          river: '#0284c7',
          textColor: '#0f172a',
          accent: '#dc2626',
          graticule: 'rgba(2, 132, 199, 0.15)',
          paperTexture: false,
          fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
        };
    }
  };

  const theme = getTheme();

  return (
    <svg
      viewBox={viewBox}
      className={`w-full h-full select-none ${className}`}
      style={{ fontFamily: theme.fontFamily }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Drop shadow */}
        <filter id={`shadow-${item.id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.18" />
        </filter>

        {/* Relief elevation gradient */}
        <linearGradient id="reliefLandGrad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#78350f" />    {/* 青藏高原褐色 */}
          <stop offset="35%" stopColor="#b45309" />   {/* 云贵/内蒙黄土高原 */}
          <stop offset="65%" stopColor="#ca8a04" />   {/* 丘陵过渡带 */}
          <stop offset="100%" stopColor="#15803d" />  {/* 东部平原翡翠绿 */}
        </linearGradient>

        {/* Paper texture pattern if antique or nautical */}
        {theme.paperTexture && (
          <pattern id={`paper-${item.id}`} width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="transparent" />
            <circle cx="20" cy="30" r="1.5" fill="rgba(80,50,20,0.05)" />
            <circle cx="75" cy="85" r="1.2" fill="rgba(80,50,20,0.04)" />
            <circle cx="85" cy="15" r="1" fill="rgba(80,50,20,0.03)" />
            <path d="M0 50 Q 25 45, 50 50 T 100 50" stroke="rgba(80,50,20,0.03)" strokeWidth="0.8" fill="none" />
          </pattern>
        )}
      </defs>

      {/* 1. Sea Background */}
      <rect width={width} height={height} fill={theme.seaBg} />
      {theme.paperTexture && (
        <rect width={width} height={height} fill={`url(#paper-${item.id})`} />
      )}

      {/* 2. Graticules (经纬网线) */}
      <g stroke={theme.graticule} strokeWidth="1" strokeDasharray={item.category === 'lithograph' ? '3,3' : undefined}>
        {isHorizontal ? (
          <>
            <path d="M 50 150 Q 600 230 1150 150" fill="none" />
            <path d="M 50 300 Q 600 400 1150 300" fill="none" />
            <path d="M 50 480 Q 600 580 1150 480" fill="none" />
            <path d="M 50 670 Q 600 750 1150 670" fill="none" />
            <path d="M 180 850 L 320 80" fill="none" />
            <path d="M 380 850 L 460 80" fill="none" />
            <path d="M 600 850 L 600 80" fill="none" />
            <path d="M 820 850 L 740 80" fill="none" />
            <path d="M 1020 850 L 880 80" fill="none" />
          </>
        ) : (
          <>
            <path d="M 50 150 Q 450 210 850 150" fill="none" />
            <path d="M 50 350 Q 450 420 850 350" fill="none" />
            <path d="M 50 580 Q 450 650 850 580" fill="none" />
            <path d="M 50 800 Q 450 850 850 800" fill="none" />
            <path d="M 50 1020 Q 450 1050 850 1020" fill="none" />
            <path d="M 120 1150 L 250 80" fill="none" />
            <path d="M 300 1150 L 380 80" fill="none" />
            <path d="M 480 1150 L 500 80" fill="none" />
            <path d="M 680 1150 L 620 80" fill="none" />
            <path d="M 820 1150 L 740 80" fill="none" />
          </>
        )}
      </g>

      {/* 3. Mainland China & Regions Rendering */}
      {isHorizontal ? (
        // ==================== HORIZONTAL MAP ====================
        <g id="horizontal-map-content">
          {/* Main China Land Polygon */}
          <path
            d="M 120 380 
               C 130 330, 160 250, 220 220 
               C 270 195, 330 200, 360 260 
               C 380 300, 420 290, 450 260 
               C 490 220, 520 180, 570 190 
               C 620 200, 660 170, 710 130 
               C 740 100, 800 80, 860 100 
               C 920 120, 960 160, 940 210 
               C 920 260, 950 300, 910 350 
               C 880 390, 840 370, 820 400 
               C 800 430, 810 470, 790 500 
               C 770 530, 800 580, 760 620 
               C 720 660, 680 660, 650 680 
               C 620 700, 580 720, 540 690 
               C 500 660, 470 680, 430 660 
               C 390 640, 360 670, 320 650 
               C 280 630, 260 590, 220 580 
               C 170 570, 150 510, 130 460 
               Z"
            fill={theme.landBg}
            stroke={theme.landBorder}
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter={`url(#shadow-${item.id})`}
          />

          {/* Internal Provincial Boundaries */}
          <g stroke={theme.provinceBorder} strokeWidth="1.2" strokeDasharray={item.category === 'standard' ? '2,2' : undefined} fill="none">
            <path d="M 130 460 C 230 440, 320 450, 370 470" />
            <path d="M 370 470 C 400 410, 450 390, 520 430 C 510 490, 460 520, 420 540 Z" />
            <path d="M 360 260 C 440 330, 550 300, 670 280 C 720 230, 800 240, 840 180" />
            <path d="M 770 240 C 820 270, 860 300, 880 370" />
            <path d="M 820 300 C 870 330, 910 320, 930 250" />
            <path d="M 420 540 C 450 580, 430 640, 410 660" />
            <path d="M 450 580 C 510 590, 520 650, 530 680" />
            <path d="M 520 580 C 570 590, 580 640, 570 670" />
            <path d="M 530 410 C 540 480, 540 540, 550 580" />
            <path d="M 550 480 C 640 480, 670 530, 660 580" />
            <path d="M 660 470 C 720 460, 760 510, 770 550" />
            <path d="M 660 580 C 700 600, 730 640, 710 660" />
            <path d="M 570 650 C 620 640, 640 680, 650 680" />
          </g>

          {/* Rivers: Yellow River & Yangtze River */}
          <path
            d="M 390 480 
               C 420 460, 440 410, 470 390 
               C 500 370, 540 370, 560 390 
               C 580 430, 550 460, 550 480 
               C 580 480, 650 470, 710 450 
               C 740 440, 760 420, 780 425"
            fill="none"
            stroke={theme.river}
            strokeWidth={item.category === 'river' ? '4.5' : '3.2'}
            strokeLinecap="round"
          />
          <path
            d="M 360 520 
               C 400 540, 440 560, 470 550 
               C 500 530, 540 550, 580 560 
               C 630 550, 670 530, 710 540 
               C 740 550, 770 530, 800 520"
            fill="none"
            stroke={theme.river}
            strokeWidth={item.category === 'river' ? '5.2' : '3.8'}
            strokeLinecap="round"
          />

          {/* Night Lights Satellite clusters */}
          {item.category === 'night' && (
            <g fill="#fbbf24" opacity="0.85">
              {/* Beijing/Tianjin */}
              <circle cx="690" cy="360" r="14" fill="url(#nightGlow)" />
              <circle cx="715" cy="380" r="9" />
              {/* Yangtze River Delta (Shanghai/Suzhou/Hangzhou/Nanjing) */}
              <circle cx="780" cy="530" r="18" fill="url(#nightGlow)" />
              <circle cx="750" cy="520" r="12" />
              <circle cx="765" cy="560" r="11" />
              {/* Pearl River Delta (Guangzhou/Shenzhen/HK) */}
              <circle cx="670" cy="670" r="16" fill="url(#nightGlow)" />
              <circle cx="685" cy="675" r="13" />
              {/* Chengdu / Chongqing */}
              <circle cx="470" cy="590" r="13" />
              <circle cx="510" cy="580" r="12" />
              {/* Wuhan */}
              <circle cx="630" cy="540" r="11" />
              {/* Xi'an */}
              <circle cx="550" cy="480" r="10" />
            </g>
          )}

          {/* Islands: Taiwan & Hainan Island */}
          <path
            d="M 580 730 C 605 725, 620 740, 610 760 C 590 775, 570 765, 575 745 Z"
            fill={theme.landBg}
            stroke={theme.landBorder}
            strokeWidth="2"
          />
          <path
            d="M 805 600 C 820 610, 825 645, 815 670 C 805 680, 795 650, 800 620 Z"
            fill={theme.landBg}
            stroke={theme.landBorder}
            strokeWidth="2"
          />

          {/* Diaoyu Dao (钓鱼岛) & Chiwei Yu (赤尾屿) */}
          <circle cx="855" cy="595" r="3" fill={theme.accent} stroke={theme.landBorder} strokeWidth="1" />
          <text x="865" y="598" fill={theme.textColor} fontSize="11" fontWeight="600">钓鱼岛</text>
          <circle cx="880" cy="590" r="2.5" fill={theme.accent} stroke={theme.landBorder} strokeWidth="1" />
          <text x="890" y="593" fill={theme.textColor} fontSize="10">赤尾屿</text>

          {/* Capital Beijing Marker */}
          <g transform="translate(690, 360)">
            <circle cx="0" cy="0" r="7" fill={theme.accent} stroke="#fff" strokeWidth="2" />
            <polygon points="0,-4 1.2,-1 4.5,-1 1.8,1 2.8,4.2 0,2.2 -2.8,4.2 -1.8,1 -4.5,-1 -1.2,-1" fill="#fff" />
            <text x="12" y="4" fill={theme.textColor} fontSize="14" fontWeight="bold">北京</text>
          </g>

          {/* Key Geographic & Provincial Labels */}
          <g fill={theme.textColor} fontSize="12" textAnchor="middle" opacity="0.85">
            <text x="260" y="380" fontSize="15" fontWeight="bold">新疆</text>
            <text x="270" y="550" fontSize="15" fontWeight="bold">西藏</text>
            <text x="440" y="460">青海</text>
            <text x="480" y="330">内蒙古</text>
            <text x="470" y="610">四川</text>
            <text x="440" y="680">云南</text>
            <text x="590" y="750" fontSize="11">海南岛</text>
            <text x="825" y="645" fontSize="11" fontWeight="bold">台湾岛</text>
            <text x="870" y="210">黑龙江</text>
            <text x="630" y="540">湖北</text>
            <text x="670" y="670">广东</text>
            <text x="740" y="470">山东</text>
            <text x="780" y="530">上海</text>
          </g>

          {/* South China Sea Inset Box (南海诸岛附图 1:3200万 规范附图) */}
          <g transform="translate(920, 560)">
            <rect width="250" height="310" fill={theme.seaBg} stroke={theme.landBorder} strokeWidth="2.5" />
            {theme.paperTexture && <rect width="250" height="310" fill={`url(#paper-${item.id})`} />}

            <rect x="0" y="0" width="250" height="28" fill={theme.landBorder} opacity="0.1" />
            <text x="125" y="19" textAnchor="middle" fill={theme.textColor} fontSize="12" fontWeight="bold">
              南海诸岛 (附图 1:3200万)
            </text>

            <path d="M 10 30 C 35 25, 50 45, 40 70 C 20 85, 0 75, 5 45 Z" fill={theme.landBg} stroke={theme.landBorder} strokeWidth="1.5" />
            <text x="25" y="60" fill={theme.textColor} fontSize="9">海南岛</text>

            {/* Ten-Dash Line (十段线) */}
            <g stroke={theme.accent} strokeWidth="2.2" strokeLinecap="round">
              <line x1="75" y1="40" x2="85" y2="46" />
              <line x1="120" y1="55" x2="135" y2="65" />
              <line x1="165" y1="90" x2="175" y2="105" />
              <line x1="190" y1="140" x2="195" y2="160" />
              <line x1="185" y1="200" x2="180" y2="220" />
              <line x1="150" y1="260" x2="135" y2="275" />
              <line x1="100" y1="285" x2="80" y2="285" />
              <line x1="50" y1="265" x2="40" y2="245" />
              <line x1="35" y1="195" x2="35" y2="175" />
              <line x1="45" y1="120" x2="55" y2="105" />
            </g>

            {/* Islands */}
            <circle cx="110" cy="70" r="3" fill={theme.textColor} />
            <text x="125" y="73" fill={theme.textColor} fontSize="9">东沙群岛</text>

            <circle cx="95" cy="120" r="3.5" fill={theme.textColor} />
            <text x="110" y="123" fill={theme.textColor} fontSize="9">西沙群岛</text>

            <circle cx="145" cy="130" r="3" fill={theme.textColor} />
            <text x="160" y="133" fill={theme.textColor} fontSize="9">中沙群岛</text>

            <circle cx="120" cy="200" r="4" fill={theme.textColor} />
            <text x="135" y="203" fill={theme.textColor} fontSize="9">南沙群岛</text>

            <circle cx="95" cy="280" r="2.5" fill={theme.accent} />
            <text x="105" y="283" fill={theme.accent} fontSize="9" fontWeight="bold">曾母暗沙</text>
          </g>

          {/* Historical Seals */}
          {item.category === 'antique' && (
            <g transform="translate(80, 80)">
              <rect x="0" y="0" width="70" height="70" fill="none" stroke="#b83b28" strokeWidth="4" rx="4" />
              <rect x="6" y="6" width="58" height="58" fill="none" stroke="#b83b28" strokeWidth="1.5" />
              <text x="35" y="32" textAnchor="middle" fill="#b83b28" fontSize="13" fontWeight="bold">大清一统</text>
              <text x="35" y="52" textAnchor="middle" fill="#b83b28" fontSize="13" fontWeight="bold">輿地之寶</text>
              <text x="180" y="45" fill="#3d2c1d" fontSize="24" fontWeight="bold" letterSpacing="4">
                皇朝一統輿地全圖
              </text>
            </g>
          )}

          {item.category === 'landscape' && (
            <g transform="translate(80, 80)">
              <rect x="0" y="0" width="60" height="60" fill="none" stroke="#eab308" strokeWidth="2.5" />
              <text x="30" y="27" textAnchor="middle" fill="#eab308" fontSize="11" fontWeight="bold">江山</text>
              <text x="30" y="46" textAnchor="middle" fill="#eab308" fontSize="11" fontWeight="bold">入畫</text>
              <text x="80" y="40" fill="#f1ebd8" fontSize="22" fontWeight="bold" letterSpacing="6">
                千里江山 · 輿圖雅集
              </text>
            </g>
          )}
        </g>
      ) : (
        // ==================== VERTICAL MAP (陆海同幅全图) ====================
        <g id="vertical-map-content">
          <path
            d="M 100 280 
               C 110 240, 140 180, 200 160 
               C 250 140, 310 145, 340 190 
               C 360 220, 400 215, 430 190 
               C 470 160, 500 130, 550 135 
               C 600 140, 640 120, 690 90 
               C 720 70, 770 55, 820 70 
               C 860 85, 875 125, 850 165 
               C 830 200, 850 240, 815 275 
               C 790 300, 755 285, 735 310 
               C 715 330, 725 365, 705 390 
               C 685 415, 715 455, 680 485 
               C 645 515, 610 515, 580 535 
               C 550 550, 520 570, 480 545 
               C 445 520, 415 535, 380 520 
               C 345 505, 320 525, 285 510 
               C 250 495, 230 460, 195 455 
               C 150 445, 130 395, 110 355 
               Z"
            fill={theme.landBg}
            stroke={theme.landBorder}
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter={`url(#shadow-${item.id})`}
          />

          {/* Rivers */}
          <path
            d="M 330 360 C 370 340, 410 290, 450 280 C 490 270, 520 320, 520 350 C 560 350, 630 340, 690 325"
            fill="none"
            stroke={theme.river}
            strokeWidth="3.2"
          />
          <path
            d="M 310 400 C 350 415, 410 425, 450 420 C 500 405, 550 415, 600 420 C 650 410, 680 395, 720 390"
            fill="none"
            stroke={theme.river}
            strokeWidth="3.8"
          />

          {/* Hainan & Taiwan */}
          <path d="M 520 570 C 545 565, 560 580, 550 600 C 530 615, 510 605, 515 585 Z" fill={theme.landBg} stroke={theme.landBorder} strokeWidth="2" />
          <text x="535" y="593" fill={theme.textColor} fontSize="11" textAnchor="middle">海南岛</text>

          <path d="M 725 470 C 740 480, 745 515, 735 540 C 725 550, 715 520, 720 490 Z" fill={theme.landBg} stroke={theme.landBorder} strokeWidth="2" />
          <text x="750" y="510" fill={theme.textColor} fontSize="11" fontWeight="bold">台湾岛</text>

          {/* Diaoyu Dao */}
          <circle cx="780" cy="460" r="3" fill={theme.accent} stroke={theme.landBorder} strokeWidth="1" />
          <text x="790" y="464" fill={theme.textColor} fontSize="10" fontWeight="bold">钓鱼岛</text>

          {/* Vertical Full-Scale South China Sea */}
          <g id="south-china-sea-vertical">
            <g stroke={theme.accent} strokeWidth="2.8" strokeLinecap="round">
              <line x1="600" y1="600" x2="620" y2="610" />
              <line x1="670" y1="630" x2="690" y2="650" />
              <line x1="720" y1="690" x2="735" y2="720" />
              <line x1="745" y1="770" x2="750" y2="810" />
              <line x1="730" y1="870" x2="720" y2="910" />
              <line x1="670" y1="980" x2="640" y2="1010" />
              <line x1="570" y1="1050" x2="530" y2="1050" />
              <line x1="460" y1="1000" x2="440" y2="960" />
              <line x1="430" y1="890" x2="430" y2="850" />
              <line x1="450" y1="760" x2="470" y2="730" />
            </g>

            <g fill={theme.textColor}>
              <circle cx="630" cy="650" r="4" fill={theme.accent} />
              <text x="645" y="654" fontSize="11" fontWeight="bold">东沙群岛</text>

              <circle cx="580" cy="730" r="4.5" fill={theme.accent} />
              <text x="595" y="734" fontSize="12" fontWeight="bold">西沙群岛</text>

              <circle cx="680" cy="750" r="4" fill={theme.accent} />
              <text x="695" y="754" fontSize="11" fontWeight="bold">中沙群岛</text>

              <circle cx="610" cy="880" r="5" fill={theme.accent} />
              <text x="625" y="884" fontSize="13" fontWeight="bold">南沙群岛</text>

              <circle cx="550" cy="1035" r="3.5" fill={theme.accent} stroke="#fff" strokeWidth="1" />
              <text x="565" y="1039" fontSize="12" fontWeight="bold" fill={theme.accent}>曾母暗沙 (3°58′N)</text>
            </g>
          </g>

          {/* Beijing */}
          <g transform="translate(630, 260)">
            <circle cx="0" cy="0" r="7" fill={theme.accent} stroke="#fff" strokeWidth="2" />
            <polygon points="0,-4 1.2,-1 4.5,-1 1.8,1 2.8,4.2 0,2.2 -2.8,4.2 -1.8,1 -4.5,-1 -1.2,-1" fill="#fff" />
            <text x="12" y="4" fill={theme.textColor} fontSize="14" fontWeight="bold">北京</text>
          </g>

          {/* Compass Rose for Nautical Series */}
          {(item.category === 'nautical' || item.category === 'antique') && (
            <g transform="translate(180, 850)">
              <circle cx="0" cy="0" r="45" fill="none" stroke={theme.accent} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="40" fill="none" stroke={theme.textColor} strokeWidth="0.8" strokeDasharray="2,2" />
              <polygon points="0,-42 7,-8 0,0 -7,-8" fill={theme.accent} />
              <polygon points="0,42 7,8 0,0 -7,8" fill={theme.textColor} opacity="0.6" />
              <polygon points="42,0 8,7 0,0 8,-7" fill={theme.textColor} opacity="0.6" />
              <polygon points="-42,0 -8,7 0,0 -8,-7" fill={theme.textColor} opacity="0.6" />
              <text x="0" y="-48" textAnchor="middle" fill={theme.accent} fontSize="13" fontWeight="bold">子 (北)</text>
              <text x="0" y="58" textAnchor="middle" fill={theme.textColor} fontSize="11">午 (南)</text>
              <text x="55" y="4" textAnchor="middle" fill={theme.textColor} fontSize="11">卯 (东)</text>
              <text x="-55" y="4" textAnchor="middle" fill={theme.textColor} fontSize="11">酉 (西)</text>
              <text x="0" y="80" textAnchor="middle" fill={theme.textColor} fontSize="12" fontWeight="bold">
                海防针经 · 水师更路
              </text>
            </g>
          )}
        </g>
      )}

      {/* 4. Cartographic Neatline */}
      <rect
        x="15"
        y="15"
        width={width - 30}
        height={height - 30}
        fill="none"
        stroke={theme.landBorder}
        strokeWidth="2.5"
      />
      <rect
        x="22"
        y="22"
        width={width - 44}
        height={height - 44}
        fill="none"
        stroke={theme.landBorder}
        strokeWidth="1"
        strokeDasharray="8, 4"
        opacity="0.6"
      />

      {/* 5. Legend & Metadata Box */}
      <g transform={`translate(${width - 240}, 40)`}>
        <rect width="210" height="72" fill={theme.seaBg} opacity="0.94" stroke={theme.landBorder} strokeWidth="1" rx="4" />
        <text x="12" y="24" fill={theme.textColor} fontSize="13" fontWeight="bold">
          {item.title}
        </text>
        <text x="12" y="43" fill={theme.textColor} fontSize="10" opacity="0.75">
          比例尺：{item.scaleText}
        </text>
        <text x="12" y="60" fill={theme.accent} fontSize="10" fontWeight="600">
          审图号：{item.approvalCode || '规范复刻版'}
        </text>
      </g>
    </svg>
  );
};
