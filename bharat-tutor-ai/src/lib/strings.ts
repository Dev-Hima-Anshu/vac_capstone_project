/**
 * UI copy for English / Telugu. Keys are shared across the app via LocaleProvider.
 */
export type Locale = "en" | "te";

export type StringKey =
  | "brand"
  | "tagline"
  | "uploadTitle"
  | "uploadHint"
  | "analyzing"
  | "viewRoadmap"
  | "dashboard"
  | "joinCircle"
  | "topicLinkedLists"
  | "topicPythonMl"
  | "topicSystemDesign"
  | "roadmapProgress"
  | "markDone"
  | "closeRoadmap"
  | "chatTitle"
  | "chatPlaceholder"
  | "send"
  | "leaveRoom"
  | "badgeEarned"
  | "badges"
  | "roadmapSection"
  | "circleSection"
  | "yourJourney"
  | "langEnglish"
  | "langTelugu"
  | "demoNotice"
  | "openChecklist"
  | "undo";

export const STRINGS: Record<Locale, Record<StringKey, string>> = {
  en: {
    brand: "BharatTutor AI",
    tagline:
      "Upload your resume, follow world-class roadmaps, and learn together in live Concept Circles — built for India’s aspiring engineers.",
    uploadTitle: "Upload Resume (PDF / DOCX)",
    uploadHint: "We analyze skills with Groq AI and map you to the right roadmap.",
    analyzing: "Analyzing your resume…",
    viewRoadmap: "View Official AI Engineer Roadmap",
    dashboard: "Progress Dashboard",
    joinCircle: "Join Concept Circle for",
    topicLinkedLists: "Linked Lists",
    topicPythonMl: "Python for ML",
    topicSystemDesign: "System Design Basics",
    roadmapProgress: "Roadmap progress",
    markDone: "Mark as Done",
    closeRoadmap: "Back to Home",
    chatTitle: "Circle chat (Firebase)",
    chatPlaceholder: "Say hi to your study circle…",
    send: "Send",
    leaveRoom: "Leave & save progress",
    badgeEarned: "You earned the Collaborative Learning badge!",
    badges: "Badges",
    roadmapSection: "Roadmap",
    circleSection: "Concept Circle",
    yourJourney: "Your journey",
    langEnglish: "English",
    langTelugu: "తెలుగు",
    demoNotice:
      "Tip: add GROQ_API_KEY and Firebase keys in .env.local for full functionality. Without them, resume analysis uses a demo response.",
    openChecklist: "Open checklist",
    undo: "Undo",
  },
  te: {
    brand: "భారత్‌ట్యూటర్ AI",
    tagline:
      "మీ రెజ్యూమె అప్‌లోడ్ చేయండి, ప్రపంచ స్థాయి రోడ్‌మ్యాప్‌లను అనుసరించండి, లైవ్ కాన్సెప్ట్ సర్కిల్స్‌లో కలిసి నేర్చుకోండి.",
    uploadTitle: "రెజ్యూమె అప్‌లోడ్ (PDF / DOCX)",
    uploadHint: "Groq AIతో నైపుణ్యాలను విశ్లేషించి సరైన రోడ్‌మ్యాప్‌కు మ్యాప్ చేస్తాం.",
    analyzing: "మీ రెజ్యూమె విశ్లేషిస్తున్నాం…",
    viewRoadmap: "అధికారిక AI ఇంజనీర్ రోడ్‌మ్యాప్ చూడండి",
    dashboard: "ప్రోగ్రెస్ డాష్‌బోర్డ్",
    joinCircle: "కాన్సెప్ట్ సర్కిల్‌లో చేరండి —",
    topicLinkedLists: "లింక్డ్ లిస్టులు",
    topicPythonMl: "ML కోసం Python",
    topicSystemDesign: "సిస్టమ్ డిజైన్ ప్రాథమికాలు",
    roadmapProgress: "రోడ్‌మ్యాప్ ప్రోగ్రెస్",
    markDone: "పూర్తయింది గుర్తు",
    closeRoadmap: "హోమ్‌కు వెనక్కి",
    chatTitle: "సర్కిల్ చాట్ (Firebase)",
    chatPlaceholder: "మీ స్టడీ సర్కిల్‌కు హాయ్ చెప్పండి…",
    send: "పంపు",
    leaveRoom: "వెళ్ళిపోయి సేవ్ చేయి",
    badgeEarned: "కలిసి నేర్చుకునే బ్యాడ్జ్ సాధించారు!",
    badges: "బ్యాడ్జ్‌లు",
    roadmapSection: "రోడ్‌మ్యాప్",
    circleSection: "కాన్సెప్ట్ సర్కిల్",
    yourJourney: "మీ ప్రయాణం",
    langEnglish: "English",
    langTelugu: "తెలుగు",
    demoNotice:
      "GROQ_API_KEY మరియు Firebase కీలను .env.localలో చేర్చండి. లేకుంటే డెమో విశ్లేషణ చూపిస్తాం.",
    openChecklist: "చెక్‌లిస్ట్ తెరవండి",
    undo: "రద్దు",
  },
};
