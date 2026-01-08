import { Platform, StyleSheet, Dimensions, PixelRatio } from "react-native";
import { COLOR_BG_GRID, HEX_GAP, HEX_H, HEX_W } from "../constants/game";

const { width: SW } = Dimensions.get("window");
const rpx = (v: number) => PixelRatio.roundToNearestPixel(v);

// 10~18dp 정도 
const GRID_PAD = rpx(Math.max(10, Math.min(18, SW * 0.04))) + 12;

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#e2e8f0" 
  },
  body: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  
  },
  gameContainer: {
    position: "relative",
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    alignSelf: "center",
    width: "95%",
    

    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,1)",
        shadowOpacity: 0.25,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },

  startOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 50,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: "#2563eb",
    borderRadius: 24,
    transform: [{ scale: 1 }],
  },
  startBtnPressed: {
    backgroundColor: "#1d4ed8",
    transform: [{ scale: 0.95 }],
  },
  startBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },

  gameOverModal: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 100,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ef4444",
    marginBottom: 8,
    fontFamily: "Pretendard",
  },
  gameOverReason: {
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 24,
    fontFamily: "Pretendard",
  },
  finalScore: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 32,
    color: "#334155",
    fontFamily: "Pretendard",
  },
  finalScoreNum: { fontWeight: "900", fontFamily: "Pretendard" },
  retryBtn: {
    paddingHorizontal:24,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 24,
    transform: [{ scale: 1 }],
    alignItems:"center",
  },
  retryBtnPressed: {
    backgroundColor: "#1d4ed8",
    transform: [{ scale: 0.95 }],
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },

  scoreBoard: { alignItems: "center", marginBottom: 10 },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 4,
    fontFamily: "Pretendard",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
  },
  topRowText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748b",
    fontFamily: "Pretendard",
  },
  scoreBlue: { color: "#2563eb", fontWeight: "900", fontFamily: "Pretendard" },
  scoreOrange: { color: "#f97316", fontWeight: "900", fontFamily: "Pretendard" },

  statusContainer: { width: "100%", marginTop: 8, marginBottom: 0 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  statusLeft: {
    fontSize: 12,
    fontWeight: "900",
    color: "#717c8bff",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    fontFamily: "Pretendard",
  },
  statusRight: {
    fontSize: 12,
    fontWeight: "900",
    color: "#717c8bff",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    fontFamily: "Pretendard",
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#3b82f6" },

  sumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 12,
    marginTop: 12,
  },
  sumDisplay: {
    color: "#f97316",
    fontSize: 36,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },
  sumDenom: {
    color: "#94a3b8",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Pretendard",
  },

  message: {
    marginTop: 12,
    height: 24,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },
  msgSlate: { color: "#64748b" },
  msgRed: { color: "#dc2626" },
  msgOrange: { color: "#f97316" },
  msgBlue: { color: "#3b82f6" },
  msgGreen: { color: "#16a34a" },
  msgPurple: { color: "#9333ea", transform: [{ scale: 1.1 }] },

  gridContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: 10,
    paddingVertical: GRID_PAD,
    paddingHorizontal: GRID_PAD  , 
    backgroundColor: COLOR_BG_GRID,
    borderRadius: 24,
    overflow: "hidden",
  },
  
  hexRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  hexRowOverlap: {   marginBottom: -Math.round(HEX_H * 0.08) -2, },
  
  hexWrapper: {
    width: HEX_W,
    height: HEX_H,
  },
  hexPress: { width: HEX_W, height: HEX_H },
  hexSvg: { width: "100%", height: "100%" },
  hexTextWrap: {
    position: "absolute",
    left: 0, top: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  hexText: {
    fontSize: HEX_W * 0.45,
    fontWeight: "900",
    fontFamily: "Pretendard",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  hexTextSelected: { color: "#fff" },

  footerWrap: { marginTop: 32, alignItems: "center", gap: 16 },
  footerPill: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    textAlign: "center",
    fontFamily: "Pretendard",
  },

  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "rgba(255,255,255,0.92)", // 시작하기처럼 흐림
    zIndex: 9999,
    elevation: 9999, // android

    borderRadius: 32, // gameContainer랑 동일하게
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 18,
    fontFamily: "Pretendard",
  },

  btnGroup: {
    width: 160,          // ← 여기서 둘 다 동일
    alignSelf: "center",
    marginTop: 16,
    textAlign:"center",
  },

  pausePrimaryBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: "#2563eb",
    borderRadius: 24,
    transform: [{ scale: 1 }],
    marginBottom: 12,
  },
  pausePrimaryBtnPressed: {
    backgroundColor: "#1d4ed8",
    transform: [{ scale: 0.95 }],
  },
  pausePrimaryText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },

  pauseSecondaryBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    backgroundColor: "#e2e8f0",
    borderRadius: 24,
    transform: [{ scale: 1 }],
  },
  pauseSecondaryBtnPressed: {
    backgroundColor: "#cbd5e1",
    transform: [{ scale: 0.95 }],
  },
  pauseSecondaryText: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },

  pauseButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.75)",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,1)",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  pauseIcon: { flexDirection: "row", columnGap: 8 },
  pauseBar: {
    width: 7,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#0f172a",
  },

});

export default styles;