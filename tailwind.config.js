/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // 메인 브랜드 컬러 (Primary Palette)
        primary: {
          50: "#f0f4ff",
          100: "#e6efff",
          200: "#c7d9ff",
          300: "#a3c1ff",
          400: "#84a8ff",
          500: "#7B9BD1", // 기본 Cornflower Blue
          600: "#6182b8",
          700: "#4d6a9f",
          800: "#3a5286",
          900: "#2d4070",
        },
        secondary: {
          50: "#f7f3ff",
          100: "#f0e9ff",
          200: "#e2d3ff",
          300: "#d1b8ff",
          400: "#bf9cff",
          500: "#A888C2", // 기본 Viola
          600: "#9070aa",
          700: "#785892",
          800: "#604379",
          900: "#4d3561",
        },
        neutral: {
          50: "#fefefe",
          100: "#fdfcf8",
          200: "#f9f7f0",
          300: "#f6f3e8",
          400: "#f2ede0",
          500: "#F5F5DC", // 기본 Gardenia
          600: "#e8e5c4",
          700: "#d6d1a8",
          800: "#c4bd8c",
          900: "#b2a970",
        },
        success: {
          50: "#f0f8f0",
          100: "#e1f2e1",
          200: "#c3e5c3",
          300: "#a5d8a5",
          400: "#9bcf9b",
          500: "#8FBC8F", // 기본 Tendril
          600: "#7aa37a",
          700: "#658a65",
          800: "#507150",
          900: "#3b583b",
        },
        warning: {
          50: "#fef7f0",
          100: "#fdf0e1",
          200: "#fbe1c3",
          300: "#f8d1a5",
          400: "#f0c28a",
          500: "#D4A5A5", // 기본 Rose Tan
          600: "#c2908a",
          700: "#a8796f",
          800: "#8e6254",
          900: "#744c3a",
        },
        info: {
          50: "#f5f7f0",
          100: "#ecf0e1",
          200: "#d9e1c3",
          300: "#c6d1a5",
          400: "#bfc48a",
          500: "#B8B068", // 기본 Willow
          600: "#a39e57",
          700: "#8e8a46",
          800: "#797536",
          900: "#646025",
        },
        muted: {
          50: "#f7f6f3",
          100: "#f0ede7",
          200: "#e1dccf",
          300: "#d2cab7",
          400: "#c3b89f",
          500: "#A69B8B", // 기본 Cobblestone
          600: "#958973",
          700: "#7d735b",
          800: "#655d43",
          900: "#4d472b",
        },
        accent: {
          50: "#f5f1e8",
          100: "#ece3d1",
          200: "#d9c7a3",
          300: "#c6ab75",
          400: "#c1a371",
          500: "#B8956D", // 기본 Mocha Mousse
          600: "#a3825b",
          700: "#8e6f49",
          800: "#795c37",
          900: "#644925",
        },
      },
      gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280", // 기본 회색
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
      },
      backgroundColor: {
        glass: "rgba(255, 255, 255, 0.1)",
        "glass-light": "rgba(255, 255, 255, 0.05)",
        "glass-strong": "rgba(255, 255, 255, 0.15)",
      },
      borderColor: {
        glass: "rgba(255, 255, 255, 0.2)",
        "glass-light": "rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7B9BD1 0%, #A888C2 100%)",
        "gradient-secondary": "linear-gradient(135deg, #A888C2 0%, #F5F5DC 100%)",
        "gradient-full": "linear-gradient(135deg, #7B9BD1 0%, #A888C2 35%, #F5F5DC 100%)",
        "gradient-success": "linear-gradient(135deg, #8FBC8F 0%, #7B9BD1 100%)",
        "gradient-warning": "linear-gradient(135deg, #D4A5A5 0%, #A888C2 100%)",
        "gradient-muted": "linear-gradient(135deg, #A69B8B 0%, #F5F5DC 100%)",
      },
      animation: {
        "bounce-ball": "bounce 1s infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(180deg)" },
        },
      },
    },
  },
  plugins: [],
};

// 사용 예시:
/*
기본 사용법:
- bg-primary-500        // 메인 블루
- bg-secondary-500      // 보라색
- bg-neutral-500        // 가드니아
- bg-success-500        // 성공 (녹색)
- bg-warning-500        // 경고 (로즈 탄)
- bg-info-500           // 정보 (윌로우)
- bg-muted-500          // 회색톤 (코블스톤)
- bg-accent-500         // 포인트 (모카 무스)
- bg-gray-500           // 기본 회색

그라데이션 사용법:
- bg-gradient-primary   // 블루 → 보라
- bg-gradient-full      // 전체 그라데이션
- bg-gradient-success   // 성공 그라데이션

글래스모피즘:
- bg-glass              // 반투명 유리
- border-glass          // 유리 테두리

텍스트 색상:
- text-primary-600      // 진한 블루 텍스트
- text-secondary-700    // 진한 보라 텍스트
- text-muted-600        // 회색 텍스트 (코블스톤)
- text-gray-600         // 기본 회색 텍스트
*/
