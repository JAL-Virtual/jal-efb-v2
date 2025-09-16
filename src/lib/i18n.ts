export type Language = 'en' | 'th' | 'cn' | 'jp' | 'kr';

export interface Translations {
  // Dashboard
  dashboard: {
    title: string;
    welcomeBack: string;
    logout: string;
    settings: string;
    home: string;
  };
  
  // Button labels
  buttons: {
    windCalc: string;
    myProfiles: string;
    map: string;
    navigraph: string;
    opt: string;
    metar: string;
    ifuel: string;
    asr: string;
    delayCodes: string;
    loadsheet: string;
    flightTools: string;
    clockZulu: string;
    notam: string;
  };
  
  // Wind Calculator
  windCalculator: {
    title: string;
    inputValues: string;
    windDirection: string;
    windSpeed: string;
    runwayNumber: string;
    crosswindLimit: string;
    windComponents: string;
    headwind: string;
    tailwind: string;
    crosswind: string;
    knots: string;
    windDirectionHint: string;
    runwayHint: string;
    crosswindExceeded: string;
    approachingLimit: string;
    tailwindPresent: string;
    close: string;
  };
  
  // Common
  common: {
    close: string;
    loading: string;
    error: string;
    success: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    dashboard: {
      title: 'JAL EFB Dashboard',
      welcomeBack: 'Welcome back',
      logout: 'Logout',
      settings: 'Settings',
      home: 'Home',
    },
    buttons: {
      windCalc: 'Wind Calc',
      myProfiles: 'My Profiles',
      map: 'Map',
      navigraph: 'Navigraph',
      opt: 'OPT',
      metar: 'Metar',
      ifuel: 'iFuel',
      asr: 'ASR',
      delayCodes: 'Delay Codes',
      loadsheet: 'Loadsheet',
      flightTools: 'Flight Tools',
      clockZulu: 'Clock / Zulu',
      notam: 'NOTAM',
    },
    windCalculator: {
      title: 'Wind Component Calculator',
      inputValues: 'Input Values',
      windDirection: 'Wind Direction (°)',
      windSpeed: 'Wind Speed (kts)',
      runwayNumber: 'Runway Number',
      crosswindLimit: 'Crosswind Limit (kts)',
      windComponents: 'Wind Components',
      headwind: 'Headwind',
      tailwind: 'Tailwind',
      crosswind: 'Crosswind',
      knots: 'kts',
      windDirectionHint: '0° = North, 90° = East, 180° = South, 270° = West',
      runwayHint: 'Runway 24 = 240° heading',
      crosswindExceeded: 'Crosswind Limit Exceeded!',
      approachingLimit: 'Approaching Crosswind Limit',
      tailwindPresent: 'Tailwind Present',
      close: 'Close',
    },
    common: {
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
  },
  
  th: {
    dashboard: {
      title: 'แดชบอร์ด JAL EFB',
      welcomeBack: 'ยินดีต้อนรับกลับ',
      logout: 'ออกจากระบบ',
      settings: 'การตั้งค่า',
      home: 'หน้าแรก',
    },
    buttons: {
      windCalc: 'คำนวณลม',
      myProfiles: 'โปรไฟล์ของฉัน',
      map: 'แผนที่',
      navigraph: 'Navigraph',
      opt: 'OPT',
      metar: 'เมตาร์',
      ifuel: 'iFuel',
      asr: 'ASR',
      delayCodes: 'รหัสความล่าช้า',
      loadsheet: 'แผ่นโหลด',
      flightTools: 'เครื่องมือการบิน',
      clockZulu: 'นาฬิกา / Zulu',
      notam: 'NOTAM',
    },
    windCalculator: {
      title: 'เครื่องคำนวณองค์ประกอบลม',
      inputValues: 'ค่าข้อมูลเข้า',
      windDirection: 'ทิศทางลม (°)',
      windSpeed: 'ความเร็วลม (นอต)',
      runwayNumber: 'หมายเลขรันเวย์',
      crosswindLimit: 'ขีดจำกัดลมขวาง (นอต)',
      windComponents: 'องค์ประกอบลม',
      headwind: 'ลมหน้า',
      tailwind: 'ลมหลัง',
      crosswind: 'ลมขวาง',
      knots: 'นอต',
      windDirectionHint: '0° = เหนือ, 90° = ตะวันออก, 180° = ใต้, 270° = ตะวันตก',
      runwayHint: 'รันเวย์ 24 = ทิศทาง 240°',
      crosswindExceeded: 'เกินขีดจำกัดลมขวาง!',
      approachingLimit: 'ใกล้ขีดจำกัดลมขวาง',
      tailwindPresent: 'มีลมหลัง',
      close: 'ปิด',
    },
    common: {
      close: 'ปิด',
      loading: 'กำลังโหลด...',
      error: 'ข้อผิดพลาด',
      success: 'สำเร็จ',
    },
  },
  
  cn: {
    dashboard: {
      title: 'JAL EFB 仪表板',
      welcomeBack: '欢迎回来',
      logout: '登出',
      settings: '设置',
      home: '首页',
    },
    buttons: {
      windCalc: '风力计算',
      myProfiles: '我的档案',
      map: '地图',
      navigraph: 'Navigraph',
      opt: 'OPT',
      metar: '气象报告',
      ifuel: 'iFuel',
      asr: 'ASR',
      delayCodes: '延误代码',
      loadsheet: '载重单',
      flightTools: '飞行工具',
      clockZulu: '时钟 / Zulu',
      notam: 'NOTAM',
    },
    windCalculator: {
      title: '风力分量计算器',
      inputValues: '输入值',
      windDirection: '风向 (°)',
      windSpeed: '风速 (节)',
      runwayNumber: '跑道编号',
      crosswindLimit: '侧风限制 (节)',
      windComponents: '风力分量',
      headwind: '顶风',
      tailwind: '顺风',
      crosswind: '侧风',
      knots: '节',
      windDirectionHint: '0° = 北, 90° = 东, 180° = 南, 270° = 西',
      runwayHint: '跑道 24 = 240° 航向',
      crosswindExceeded: '超过侧风限制!',
      approachingLimit: '接近侧风限制',
      tailwindPresent: '存在顺风',
      close: '关闭',
    },
    common: {
      close: '关闭',
      loading: '加载中...',
      error: '错误',
      success: '成功',
    },
  },
  
  jp: {
    dashboard: {
      title: 'JAL EFB ダッシュボード',
      welcomeBack: 'おかえりなさい',
      logout: 'ログアウト',
      settings: '設定',
      home: 'ホーム',
    },
    buttons: {
      windCalc: '風計算',
      myProfiles: 'マイプロフィール',
      map: 'マップ',
      navigraph: 'Navigraph',
      opt: 'OPT',
      metar: 'メタール',
      ifuel: 'iFuel',
      asr: 'ASR',
      delayCodes: '遅延コード',
      loadsheet: 'ロードシート',
      flightTools: 'フライトツール',
      clockZulu: '時計 / Zulu',
      notam: 'NOTAM',
    },
    windCalculator: {
      title: '風成分計算機',
      inputValues: '入力値',
      windDirection: '風向 (°)',
      windSpeed: '風速 (kt)',
      runwayNumber: '滑走路番号',
      crosswindLimit: '横風制限 (kt)',
      windComponents: '風成分',
      headwind: '向かい風',
      tailwind: '追い風',
      crosswind: '横風',
      knots: 'kt',
      windDirectionHint: '0° = 北, 90° = 东, 180° = 南, 270° = 西',
      runwayHint: '滑走路 24 = 240° 方位',
      crosswindExceeded: '横風制限超過!',
      approachingLimit: '横風制限に近づいています',
      tailwindPresent: '追い風があります',
      close: '閉じる',
    },
    common: {
      close: '閉じる',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
    },
  },
  
  kr: {
    dashboard: {
      title: 'JAL EFB 대시보드',
      welcomeBack: '다시 오신 것을 환영합니다',
      logout: '로그아웃',
      settings: '설정',
      home: '홈',
    },
    buttons: {
      windCalc: '바람 계산',
      myProfiles: '내 프로필',
      map: '지도',
      navigraph: 'Navigraph',
      opt: 'OPT',
      metar: '메타르',
      ifuel: 'iFuel',
      asr: 'ASR',
      delayCodes: '지연 코드',
      loadsheet: '로드시트',
      flightTools: '비행 도구',
      clockZulu: '시계 / Zulu',
      notam: 'NOTAM',
    },
    windCalculator: {
      title: '바람 성분 계산기',
      inputValues: '입력 값',
      windDirection: '풍향 (°)',
      windSpeed: '풍속 (kt)',
      runwayNumber: '활주로 번호',
      crosswindLimit: '횡풍 제한 (kt)',
      windComponents: '바람 성분',
      headwind: '정면풍',
      tailwind: '후면풍',
      crosswind: '횡풍',
      knots: 'kt',
      windDirectionHint: '0° = 북, 90° = 동, 180° = 남, 270° = 서',
      runwayHint: '활주로 24 = 240° 방향',
      crosswindExceeded: '횡풍 제한 초과!',
      approachingLimit: '횡풍 제한에 근접',
      tailwindPresent: '후면풍 존재',
      close: '닫기',
    },
    common: {
      close: '닫기',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
    },
  },
};

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}

export function getSupportedLanguages(): { code: Language; name: string; flag: string }[] {
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'cn', name: '中文', flag: '🇨🇳' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
    { code: 'kr', name: '한국어', flag: '🇰🇷' },
  ];
}
