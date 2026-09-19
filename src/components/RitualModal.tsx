import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';

interface RitualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RitualModal: React.FC<RitualModalProps> = ({ isOpen, onClose }) => {
  // ESC 键关闭支持
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ritual-title"
    >
      {/* 弹窗主体卡片 (阻止事件冒泡以避免点击内容区误关) */}
      <div
        className="w-full max-w-lg relative rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(197,160,89,0.22)] border border-[#c5a059]/50 bg-gradient-to-b from-[#181a22] via-[#121318] to-[#0c0d11] text-[#f4eee5] transition-transform duration-300 scale-100 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 内嵌宣纸金丝装裱衬线 (Double gold-filigree frame) */}
        <div className="border border-[#c5a059]/30 rounded-xl p-6 sm:p-8 relative overflow-hidden">
          {/* 四角金石装裱角花装饰 */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#c5a059]/60 pointer-events-none" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#c5a059]/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#c5a059]/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#c5a059]/60 pointer-events-none" />

          {/* 右上角雅致关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#c5a059]/70 hover:text-[#f7e2a9] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="关闭秘境"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* 1. 顶部：徽标 + 天机奇遇标题 + 朱砂篆刻印章 */}
          <div className="flex flex-col items-center text-center mt-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#c5a059]/25 via-amber-900/30 to-[#b92b27]/30 border border-[#c5a059]/60 flex items-center justify-center shadow-[0_0_20px_rgba(217,119,6,0.3)] mb-3">
              <Sparkles className="w-6 h-6 text-[#f3d995] animate-pulse" />
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h2
                id="ritual-title"
                className="text-2xl sm:text-3xl font-bold tracking-[0.2em] font-['STKaiti','Kaiti_SC','KaiTi','Songti_SC',serif] text-transparent bg-clip-text bg-gradient-to-r from-[#fae7b9] via-[#e5c158] to-[#fae7b9]"
              >
                天机 · 奇遇
              </h2>
            </div>

            {/* 朱砂篆刻印章 */}
            <div className="wuxia-seal-badge px-2.5 py-0.5 mt-1 tracking-widest text-[11px] sm:text-xs">
              九域合符 · 山河对勘
            </div>
          </div>

          {/* 典雅分割金线 */}
          <div className="flex items-center justify-center gap-2 my-5 opacity-60">
            <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#c5a059]" />
            <div className="w-1.5 h-1.5 rotate-45 border border-[#c5a059] bg-amber-400/40" />
            <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#c5a059]" />
          </div>

          {/* 2. 中部：古典雅致欢迎词与意境引导 */}
          <div className="text-center space-y-3 px-1 sm:px-3">
            <p className="font-['STKaiti','Kaiti_SC','KaiTi','Songti_SC',serif] text-base sm:text-lg leading-relaxed text-[#faeed9] tracking-wide">
              “偶入舆图秘境，乾坤万里入卷。”
            </p>
            <p className="font-['STKaiti','Kaiti_SC','KaiTi','Songti_SC',serif] text-xs sm:text-sm leading-relaxed text-[#cec4b3] max-w-md mx-auto">
              两图对勘分毫厘，珠帘半卷合山河。少侠既得此机缘，不妨展卷细勘九域规制，同鉴古今舆地之美。
            </p>

            {/* 四大功能古风小令微标 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 pb-1">
              {[
                { title: '帘卷山河', desc: '双向对勘' },
                { title: '双镜对映', desc: '两极同步' },
                { title: '浮光重影', desc: '叠置透视' },
                { title: '山河百卷', desc: '大千图录' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-black/35 border border-[#c5a059]/25 rounded-lg py-2 px-1 text-center group hover:border-[#c5a059]/60 transition-colors"
                >
                  <div className="text-[12px] sm:text-[13px] font-semibold text-[#f0dfbe] font-['STKaiti','Kaiti_SC','KaiTi',serif]">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-[#9c9384] mt-0.5 font-mono">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 底部：主要行动按钮（金光呼吸动效） */}
          <div className="mt-7 flex flex-col items-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-3/4 py-2.5 sm:py-3 px-6 rounded-xl font-medium text-sm sm:text-base tracking-[0.16em] font-['STKaiti','Kaiti_SC','KaiTi',serif] text-[#1c1206] font-bold bg-gradient-to-r from-[#d8b054] via-[#f5d788] to-[#d8b054] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_25px_rgba(216,176,84,0.45)] hover:shadow-[0_0_35px_rgba(216,176,84,0.65)] gold-breath-btn"
            >
              开启秘境 · 入卷领略
            </button>
            <p className="text-[11px] text-[#8e8576] mt-2.5 tracking-wider">
              按 ESC 键或点击外部任意区域亦可入卷
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
