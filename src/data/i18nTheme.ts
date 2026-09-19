export interface ThemeTexts {
  brandTitle: string;
  brandShort: string;
  brandSub: string;
  modeSwipe: string;
  modeSync: string;
  modeOverlay: string;
  btnSwap: string;
  btnZoom100: string;
  btnGallery: string;
  btnCompliance: string;
  loadingTiles: string;
  eggToast: string;
  toggleWuxiaBadge: string;
  toggleModernBadge: string;
}

export const THEME_PACKS: Record<'modern' | 'wuxia', ThemeTexts> = {
  modern: {
    brandTitle: '勘准图 KanZhun',
    brandShort: '勘准图',
    brandSub: '标准底图与自绘复刻比较',
    modeSwipe: '卷帘对比',
    modeSync: '双屏联动',
    modeOverlay: '透明叠置',
    btnSwap: '交换上下图层',
    btnZoom100: '100% 原始比例',
    btnGallery: '地图画廊',
    btnCompliance: '标准底图与自绘复刻对比说明',
    loadingTiles: '正在加载切片...',
    eggToast: '',
    toggleWuxiaBadge: '江湖',
    toggleModernBadge: '现世',
  },
  wuxia: {
    brandTitle: '九域合符',
    brandShort: '合符',
    brandSub: '两图对勘见毫厘，珠帘半卷合山河',
    modeSwipe: '帘卷山河',
    modeSync: '双镜对映',
    modeOverlay: '浮光重影',
    btnSwap: '乾坤易位',
    btnZoom100: '还原本真',
    btnGallery: '山河百卷',
    btnCompliance: '奉旨勘核规制说明',
    loadingTiles: '正在研墨展卷...',
    eggToast: '📜 偶得机缘：少侠正展开御制《山河对勘卷》',
    toggleWuxiaBadge: '江湖',
    toggleModernBadge: '现世',
  },
};
