import React, { useEffect, useRef, useState } from 'react';

/**
 * 物理纸张做旧纹理生成器 (五维能量守恒算法)
 */
class PaperTextureGenerator {
  static create() {
    try {
      const pSize = 360;
      const pCanvas = document.createElement('canvas');
      pCanvas.width = pSize;
      pCanvas.height = pSize;
      const pCtx = pCanvas.getContext('2d');
      if (!pCtx) return null;

      pCtx.clearRect(0, 0, pSize, pSize);

      // A. 动态会话级随机种子
      let seed = (Date.now() ^ (Math.random() * 0x10000000)) >>> 0;
      function rnd() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      }

      // B. 五维区间严格归一化 (Sum of Weights = 1.0)
      const intervals = [
        { min: 0.10, max: 0.22 }, // 竹帘
        { min: 0.10, max: 0.22 }, // 楮皮
        { min: 0.18, max: 0.30 }, // 纤维
        { min: 0.22, max: 0.34 }, // 底润
        { min: 0.10, max: 0.22 }, // 云絮
      ];
      const raw = intervals.map((item) => item.min + rnd() * (item.max - item.min));
      const sumRaw = raw.reduce((a, b) => a + b, 0);
      const [w_bamboo, w_bark, w_fiber, w_patina, w_cloud] = raw.map((w) => w / sumRaw);

      // C. 【竹】竹帘经纬横纵线 (横向 4px 细帘线 + 纵向 32px~40px 帘骨)
      const yOffset = rnd() * 4;
      pCtx.fillStyle = `rgba(235, 205, 145, ${(0.04 + w_bamboo * 0.46).toFixed(3)})`;
      for (let y = yOffset; y < pSize; y += 4) {
        pCtx.fillRect(0, y, pSize, 1.05);
      }
      const xStep = Math.round(32 + rnd() * 8);
      pCtx.fillStyle = `rgba(235, 205, 145, ${(0.03 + w_bamboo * 0.35).toFixed(3)})`;
      for (let x = rnd() * xStep; x < pSize; x += xStep) {
        pCtx.fillRect(x, 0, 1.2, pSize);
      }

      // D. 【纤】全向 360° 散落植物长短纤维丝 (数量适中、自然曲率)
      pCtx.strokeStyle = `rgba(245, 220, 170, ${(0.14 + w_fiber * 0.52).toFixed(3)})`;
      pCtx.lineWidth = 0.8 + w_fiber * 0.7;
      const fiberCount = Math.round(40 + w_fiber * 180);
      pCtx.beginPath();
      for (let i = 0; i < fiberCount; i++) {
        const fx = rnd() * pSize;
        const fy = rnd() * pSize;
        const len = 5 + rnd() * (12 + w_fiber * 18);
        const angle = rnd() * Math.PI * 2;
        pCtx.moveTo(fx, fy);
        pCtx.quadraticCurveTo(
          fx + Math.cos(angle) * (len * 0.5) + (rnd() - 0.5) * 4,
          fy + Math.sin(angle) * (len * 0.5) + (rnd() - 0.5) * 4,
          fx + Math.cos(angle) * len,
          fy + Math.sin(angle) * len
        );
      }
      pCtx.stroke();

      // E. 【皮】草本颗粒与矿物微观斑点 (180 ~ 400+ 颗)
      pCtx.fillStyle = `rgba(250, 225, 180, ${(0.14 + w_bark * 0.62).toFixed(3)})`;
      const speckCount = Math.round(180 + w_bark * 1000);
      for (let i = 0; i < speckCount; i++) {
        const px = rnd() * pSize;
        const py = rnd() * pSize;
        const r = rnd() < 0.84 ? (0.6 + w_bark * 0.5) : (1.2 + rnd() * (0.5 + w_bark * 0.8));
        pCtx.beginPath();
        pCtx.arc(px, py, r, 0, Math.PI * 2);
        pCtx.fill();
      }

      // F. 【絮】水墨云絮晕染斑驳 (14 ~ 32+ 团)
      const cloudAlpha = 0.04 + w_cloud * 0.26;
      const cloudCount = Math.round(14 + w_cloud * 75);
      for (let i = 0; i < cloudCount; i++) {
        const cx = rnd() * pSize;
        const cy = rnd() * pSize;
        const radius = 8 + rnd() * (16 + w_cloud * 26);
        const grad = pCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(228, 196, 140, ${cloudAlpha.toFixed(3)})`);
        grad.addColorStop(1, 'rgba(228, 196, 140, 0)');
        pCtx.fillStyle = grad;
        pCtx.beginPath();
        pCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        pCtx.fill();
      }

      return {
        dataUrl: pCanvas.toDataURL('image/webp', 0.88),
        config: {
          w_bamboo,
          w_bark,
          w_fiber,
          w_patina,
          w_cloud,
          centerAlpha: (0.16 + w_patina * 0.45).toFixed(3),
          midAlpha: (0.24 + w_patina * 0.50).toFixed(3),
          edgeAlpha: (0.62 + w_patina * 0.48).toFixed(3),
        },
      };
    } catch (e) {
      console.warn('PaperTextureGenerator error:', e);
      return null;
    }
  }
}

interface AncientPaperOverlayProps {
  active: boolean;
}

export const AncientPaperOverlay: React.FC<AncientPaperOverlayProps> = ({ active }) => {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const isGeneratedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!active) return;
    if (isGeneratedRef.current && textureUrl) return;

    // 单会话稳定生成并缓存，避免重绘闪烁
    const result = PaperTextureGenerator.create();
    if (result && result.dataUrl) {
      setTextureUrl(result.dataUrl);
      isGeneratedRef.current = true;
    }
  }, [active, textureUrl]);

  if (!active || !textureUrl) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-500"
      aria-hidden="true"
    >
      {/* 1. 宣纸手作肌理层 (无缝平铺，由 Canvas 算法程序化生成) */}
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.09] mix-blend-multiply dark:mix-blend-screen transition-opacity duration-300"
        style={{
          backgroundImage: `url(${textureUrl})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '360px 360px',
        }}
      />

      {/* 2. 古水墨底润与微润暗角 (暖色琥珀透光渐变) */}
      <div
        className="absolute inset-0 opacity-[0.25] dark:opacity-[0.14] pointer-events-none mix-blend-soft-light transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(245, 230, 200, 0.4) 0%, rgba(220, 195, 155, 0.25) 55%, rgba(60, 45, 25, 0.35) 100%)',
        }}
      />
    </div>
  );
};
