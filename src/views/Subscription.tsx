'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronRight, CreditCard, Calendar, AlertTriangle, Shield, CheckCircle, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
type CancelStep = "confirm" | "survey" | "offer" | "done";
type CancelReason = "time" | "price" | "value" | "other" | null;
const reasonOptions = [{
  key: "time" as const,
  icon: "\u23F3",
  label: "\u05D0\u05D9\u05DF \u05DC\u05D9 \u05D6\u05DE\u05DF \u05DB\u05E8\u05D2\u05E2"
}, {
  key: "price" as const,
  icon: "\uD83D\uDCB8",
  label: "\u05D9\u05E7\u05E8 \u05DC\u05D9 \u05DB\u05E8\u05D2\u05E2"
}, {
  key: "value" as const,
  icon: "\uD83E\uDD2F",
  label: "\u05DC\u05D0 \u05D4\u05E6\u05DC\u05D7\u05EA\u05D9 \u05DC\u05D4\u05D5\u05E6\u05D9\u05D0 \u05E2\u05E8\u05DA"
}, {
  key: "other" as const,
  icon: "\u2753",
  label: "\u05D0\u05D7\u05E8 / \u05DC\u05D0 \u05E8\u05DC\u05D5\u05D5\u05E0\u05D8\u05D9 \u05DB\u05E8\u05D2\u05E2"
}];
const offerContent: Record<Exclude<CancelReason, "other" | null>, {
  title: string;
  body: string;
  cta: string;
}> = {
  time: {
    title: "\u05DC\u05D2\u05DE\u05E8\u05D9 \u05DE\u05D5\u05D1\u05DF \uD83D\uDE4F",
    body: `\u05D0\u05E0\u05D7\u05E0\u05D5 \u05D7\u05D9\u05D9\u05DD \u05D1\u05DE\u05D3\u05D9\u05E0\u05D4 \u05E9\u05D4\u05DB\u05DC \u05E4\u05D4 \u05E7\u05D5\u05E8\u05D4 \u05D1\u05E7\u05E6\u05D1 \u05DE\u05D8\u05D5\u05E8\u05E3 \u05D5\u05D6\u05D0\u05EA \u05D1\u05D0\u05DE\u05EA \u05D4\u05E1\u05D9\u05D1\u05D4 \u05D4\u05DB\u05D9 \u05E0\u05E4\u05D5\u05E6\u05D4 \u05E9\u05D0\u05E0\u05E9\u05D9\u05DD \u05DE\u05D7\u05DC\u05D9\u05D8\u05D9\u05DD \u05DC\u05E2\u05D6\u05D5\u05D1, \u05D0\u05EA\u05D4 \u05DC\u05D0 \u05DC\u05D1\u05D3.

\u05D7\u05E9\u05D5\u05D1 \u05DC\u05E0\u05D5 \u05DC\u05E9\u05D9\u05DD \u05D0\u05EA \u05D6\u05D4 \u05E2\u05DC \u05D4\u05E9\u05D5\u05DC\u05D7\u05DF \u2014 \u05D1\u05E8\u05D2\u05E2 \u05E9\u05D0\u05EA\u05D4 \u05E2\u05D5\u05D6\u05D1 \u05D0\u05EA \u05D4\u05DE\u05D5\u05E2\u05D3\u05D5\u05DF, \u05D4\u05D7\u05D9\u05D5\u05D1 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9 \u05D9\u05E2\u05E6\u05E8 \u05D5\u05D0\u05D9\u05EA\u05D5 \u05D2\u05DD \u05D4\u05D6\u05DB\u05D0\u05D5\u05EA \u05DC\u05D4\u05E0\u05D5\u05EA \u05DE\u05D4\u05DE\u05D7\u05D9\u05E8 \u05D4\u05D6\u05D4.

\u05D0\u05E0\u05D7\u05E0\u05D5 \u05DE\u05DB\u05D9\u05E0\u05D9\u05DD \u05DB\u05DE\u05D4 \u05D3\u05D1\u05E8\u05D9\u05DD \u05D2\u05D3\u05D5\u05DC\u05D9\u05DD \u05D1\u05DE\u05D5\u05E2\u05D3\u05D5\u05DF \u05DC\u05D4\u05DE\u05E9\u05DA \u05D5\u05DC\u05DB\u05DF \u05D4\u05DE\u05D7\u05D9\u05E8 \u05E9\u05DC \u05D4\u05DE\u05D5\u05E2\u05D3\u05D5\u05DF \u05E2\u05EA\u05D9\u05D3 \u05DC\u05E2\u05DC\u05D5\u05EA \u05D1\u05E7\u05E8\u05D5\u05D1.

\u05D0\u05DD \u05D6\u05D4 \u05E8\u05E7 \u05EA\u05E7\u05D5\u05E4\u05D4 \u05E2\u05DE\u05D5\u05E1\u05D4 \u05D5\u05D0\u05EA\u05D4 \u05E8\u05D5\u05D0\u05D4 \u05D0\u05EA \u05E2\u05E6\u05DE\u05DA \u05D7\u05D5\u05D6\u05E8 \u05D0\u05DC\u05D9\u05E0\u05D5 \u05D1\u05D4\u05DE\u05E9\u05DA \u2014 \u05DB\u05D3\u05D9 \u05DC\u05E9\u05DE\u05D5\u05E8 \u05DC\u05DA \u05D0\u05EA \u05D4\u05DE\u05D7\u05D9\u05E8 \u05D4\u05E0\u05D5\u05DB\u05D7\u05D9 \u05D0\u05E0\u05D7\u05E0\u05D5 \u05E8\u05D5\u05E6\u05D9\u05DD \u05DC\u05D0\u05E4\u05E9\u05E8 \u05DC\u05DA \u05DC\u05D4\u05E0\u05D5\u05EA \u05DE\u05D4\u05D7\u05D5\u05D3\u05E9 \u05D4\u05E7\u05E8\u05D5\u05D1 \u05D1-\u20AA1 \u05D1\u05DC\u05D1\u05D3 \u2014 \u05D1\u05DC\u05D9 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA, \u05D5\u05D0\u05D6 \u05DC\u05D4\u05D7\u05DC\u05D9\u05D8 \u05DE\u05D7\u05D3\u05E9.

\u05E9\u05D9\u05DD \u05DC\u05D1 \u2014 \u05D6\u05D0\u05EA \u05D4\u05E6\u05E2\u05D4 \u05D7\u05D3 \u05E4\u05E2\u05DE\u05D9\u05EA. \u05D1\u05E8\u05D2\u05E2 \u05E9\u05EA\u05D1\u05D8\u05DC \u05DC\u05D0 \u05EA\u05D4\u05D9\u05D4 \u05D6\u05DB\u05D0\u05D5\u05EA \u05DC\u05D4\u05D8\u05D1\u05D4 \u05E9\u05D5\u05D1.`,
    cta: "\u2705 \u05DC\u05D4\u05D9\u05E9\u05D0\u05E8 \u05D1\u05E9\u05E7\u05DC \u05DC\u05D7\u05D5\u05D3\u05E9 \u05D4\u05D1\u05D0"
  },
  price: {
    title: "\u05D0\u05E0\u05D7\u05E0\u05D5 \u05DE\u05D1\u05D9\u05E0\u05D9\u05DD \uD83D\uDC99",
    body: `\u05D4\u05DE\u05D8\u05E8\u05D4 \u05E9\u05DC \u05D4\u05DE\u05D5\u05E2\u05D3\u05D5\u05DF \u05D4\u05D9\u05D0 \u05DC\u05D4\u05E0\u05D2\u05D9\u05E9 AI \u05DC\u05DB\u05D5\u05DC\u05DD \u05D5\u05D0\u05E0\u05D7\u05E0\u05D5 \u05DE\u05E9\u05EA\u05D3\u05DC\u05D9\u05DD \u05DC\u05EA\u05EA \u05D0\u05EA \u05D4\u05DE\u05E7\u05E1\u05D9\u05DE\u05D5\u05DD \u05E2\u05E8\u05DA \u05D5\u05D1\u05DE\u05D7\u05D9\u05E8 \u05D4\u05DB\u05D9 \u05E0\u05D2\u05D9\u05E9 \u05E9\u05D0\u05E4\u05E9\u05E8. \u05D0\u05E0\u05D7\u05E0\u05D5 \u05D9\u05D5\u05D3\u05E2\u05D9\u05DD \u05E9\u05DC\u05E4\u05E2\u05DE\u05D9\u05DD \u05D4\u05EA\u05E7\u05E6\u05D9\u05D1 \u05E4\u05E9\u05D5\u05D8 \u05E7\u05E6\u05EA \u05DC\u05D5\u05D7\u05E5 \u05D5\u05D6\u05D4 \u05D1\u05E1\u05D3\u05E8 \u05D2\u05DE\u05D5\u05E8.

\u05D0\u05DD \u05D6\u05D4 \u05DE\u05E9\u05D4\u05D5 \u05D6\u05DE\u05E0\u05D9, \u05D1\u05D0 \u05DC\u05E0\u05D5 \u05DC\u05E2\u05D6\u05D5\u05E8 \u05E2\u05DD \u05DE\u05EA\u05E0\u05D4 \u05E7\u05D8\u05E0\u05D4 \u05D5\u05DC\u05EA\u05EA \u05DC\u05DA \u05D0\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9 \u05D4\u05D1\u05D0 \u05D1-\u20AA1 \u05D1\u05DC\u05D1\u05D3 \u2014 \u05D1\u05DC\u05D9 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA. \u05EA\u05D5\u05DB\u05DC \u05D0\u05D7\u05E8\u05D9 \u05D6\u05D4 \u05DC\u05D4\u05D7\u05DC\u05D9\u05D8 \u05D0\u05DD \u05DE\u05EA\u05D0\u05D9\u05DD \u05DC\u05DA \u05DC\u05D4\u05D9\u05E9\u05D0\u05E8 \u05D0\u05D5 \u05DC\u05D0.`,
    cta: "\u2705 \u05DC\u05D4\u05D9\u05E9\u05D0\u05E8 \u05D1\u05E9\u05E7\u05DC \u05DC\u05D7\u05D5\u05D3\u05E9 \u05D4\u05D1\u05D0"
  },
  value: {
    title: "\u05EA\u05D5\u05D3\u05D4 \u05E2\u05DC \u05D4\u05DB\u05E0\u05D5\u05EA \uD83D\uDE4F",
    body: `\u05D0\u05DD \u05DC\u05D0 \u05D4\u05E6\u05DC\u05D7\u05EA \u05DC\u05D4\u05D5\u05E6\u05D9\u05D0 \u05E2\u05E8\u05DA \u2014 \u05D6\u05D4 \u05E2\u05DC\u05D9\u05E0\u05D5, \u05DC\u05D0 \u05E2\u05DC\u05D9\u05DA.

\u05D0\u05E0\u05D7\u05E0\u05D5 \u05E8\u05D5\u05E6\u05D9\u05DD \u05DC\u05D4\u05E6\u05D9\u05E2 \u05DC\u05DA \u05DC\u05D4\u05D9\u05E9\u05D0\u05E8 \u05DC\u05D7\u05D5\u05D3\u05E9 \u05D4\u05D1\u05D0 \u05D1\u05E2\u05DC\u05D5\u05EA \u05E9\u05DC \u20AA1 \u05D1\u05DC\u05D1\u05D3 \u05D5\u05D1\u05E8\u05D2\u05E2 \u05E9\u05EA\u05DC\u05D7\u05E5 \u05E2\u05DC \u05D4\u05DB\u05E4\u05EA\u05D5\u05E8 \u05DB\u05D0\u05DF \u05DC\u05DE\u05D8\u05D4 \u05E0\u05E9\u05DC\u05D7 \u05DC\u05DA \u05D2\u05DD \u05D1\u05DE\u05D9\u05D9\u05DC \u05D5\u05D2\u05DD \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4 \u05EA\u05DB\u05E0\u05D9\u05EA \u05E4\u05E2\u05D5\u05DC\u05D4 \u05D1\u05E8\u05D5\u05E8\u05D4 \u05E9\u05DC \u05D0\u05D9\u05DA \u05DC\u05D4\u05D5\u05E6\u05D9\u05D0 \u05D0\u05EA \u05D4\u05DE\u05E7\u05E1\u05D9\u05DE\u05D5\u05DD \u05DE\u05D4\u05DE\u05D5\u05E2\u05D3\u05D5\u05DF \u05D5\u05DC\u05D4\u05E4\u05D9\u05E7 \u05E2\u05E8\u05DA \u2014 \u05DC\u05E4\u05D9 \u05D4\u05DE\u05E6\u05D1 \u05E9\u05D0\u05EA\u05D4 \u05E0\u05DE\u05E6\u05D0 \u05D1\u05D5 \u05D4\u05D9\u05D5\u05DD.

\u05D7\u05D5\u05D3\u05E9 \u05D4\u05D1\u05D0 \u05D1-\u20AA1 \u05D1\u05DC\u05D1\u05D3 \u05DB\u05D3\u05D9 \u05E9\u05EA\u05D5\u05DB\u05DC \u05DC\u05D1\u05D3\u05D5\u05E7 \u05D0\u05EA \u05D6\u05D4 \u05D1\u05DC\u05D9 \u05E1\u05D9\u05DB\u05D5\u05DF \u05D5\u05D0\u05D7\u05E8\u05D9 \u05D6\u05D4 \u05DC\u05D4\u05D7\u05DC\u05D9\u05D8 \u05D0\u05DD \u05D0\u05EA\u05D4 \u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05D9\u05E9\u05D0\u05E8 \u05D0\u05D5 \u05DC\u05D0.`,
    cta: "\u2705 \u05DB\u05DF, \u05EA\u05E0\u05D5 \u05DC\u05D9 \u05D4\u05D6\u05D3\u05DE\u05E0\u05D5\u05EA"
  }
};
export default function SubscriptionPage() {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<CancelStep>("confirm");
  const [cancelReason, setCancelReason] = useState<CancelReason>(null);
  const [cancelled, setCancelled] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/27");
  const openCancel = () => {
    setCancelStep("confirm");
    setCancelReason(null);
    setCancelOpen(true);
  };
  const handleConfirmYes = () => setCancelStep("survey");
  const handleReasonSelect = (reason: CancelReason) => {
    setCancelReason(reason);
    if (reason === "other") {
      // Skip offer, go straight to done
      setCancelled(true);
      setCancelStep("done");
    } else {
      setCancelStep("offer");
    }
  };
  const handleAcceptOffer = () => {
    setCancelOpen(false);
    // Fire confetti
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: {
          x: 0,
          y: 0.7
        }
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: {
          x: 1,
          y: 0.7
        }
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };
  const handleFinalCancel = () => {
    setCancelled(true);
    setCancelStep("done");
  };
  const closeDialog = () => {
    setCancelOpen(false);
  };
  return <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{
      opacity: 0,
      y: 12
    }} animate={{
      opacity: 1,
      y: 0
    }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push("/profile")}>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-2xl font-bold">ניהול מנוי</h1>
      </motion.div>

      {/* Current Plan */}
      <motion.div initial={{
      opacity: 0,
      y: 12
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.05
    }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm card-shadow overflow-hidden">
          <div className="h-1.5 gradient-primary" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">המנוי שלך</CardTitle>
              {cancelled ? <Badge variant="destructive" className="font-bold">בוטל</Badge> : <Badge className="gradient-primary border-0 font-bold">פעיל ✨</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">חבר פרימיום</p>
                <p className="text-sm text-muted-foreground">גישה מלאה לכל תכני המועדון</p>
              </div>
              <p className="font-display text-2xl font-bold">₪49/חודש<span className="text-sm text-muted-foreground font-normal">/חודש</span></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">תאריך חידוש</p>
                <p className="text-sm font-bold">15/03/2026</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <Shield className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">חבר מאז</p>
                <p className="text-sm font-bold">ינואר 2026</p>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">כלול במנוי שלך:</p>
              {["גישה לכל הקורסים והשיעורים", "הקלטות מלאות של כל האירועים", "קבוצות דיון ונטוורקינג", "מנטור AI אישי"].map(f => <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-xs">{f}</p>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Method */}
      <motion.div initial={{
      opacity: 0,
      y: 12
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.1
    }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">אמצעי תשלום</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditPayment(!editPayment)}>
                {editPayment ? "ביטול" : "שינוי"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editPayment ? <div className="space-y-4">
                <div className="space-y-2">
                  <Label>מספר כרטיס</Label>
                  <Input placeholder="1234 5678 9012 3456" dir="ltr" className="text-left" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>תוקף</Label>
                    <Input placeholder="MM/YY" dir="ltr" className="text-left" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input placeholder="123" dir="ltr" className="text-left" type="password" />
                  </div>
                </div>
                <Button className="w-full gradient-primary border-0 font-bold" onClick={() => {
              setCardNumber("•••• •••• •••• 8888");
              setCardExpiry("06/28");
              setEditPayment(false);
            }}>
                  עדכן אמצעי תשלום
                </Button>
              </div> : <div className="flex items-center gap-4 bg-secondary/50 rounded-xl p-4">
                <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" dir="ltr">{cardNumber}</p>
                  <p className="text-xs text-muted-foreground">תוקף: {cardExpiry}</p>
                </div>
              </div>}
          </CardContent>
        </Card>
      </motion.div>

      {/* Cancel */}
      {!cancelled && <motion.div initial={{
      opacity: 0,
      y: 12
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.15
    }}>
          <Card className="border-destructive/20 bg-card/80 backdrop-blur-sm card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">ביטול מנוי</p>
                  <p className="text-xs text-muted-foreground">המנוי יהיה פעיל עד סוף תקופת החיוב</p>
                </div>
                <Button variant="destructive" size="sm" onClick={openCancel}>
                  ביטול מנוי
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>}

      {cancelled && <motion.div initial={{
      opacity: 0,
      y: 12
    }} animate={{
      opacity: 1,
      y: 0
    }}>
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">המנוי בוטל</p>
                  <p className="text-xs text-muted-foreground">הגישה שלך תסתיים ב-15/03/2026</p>
                </div>
                <Button size="sm" className="gradient-primary border-0 font-bold" onClick={() => setCancelled(false)}>
                  חידוש מנוי
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>}

      {/* Cancel Flow Dialog */}
      <Dialog open={cancelOpen} onOpenChange={open => {
      if (!open) closeDialog();
    }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Confirm */}
            {cancelStep === "confirm" && <motion.div key="confirm" initial={{
            opacity: 0,
            x: 30
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -30
          }} transition={{
            duration: 0.2
          }} className="p-6">
                <DialogHeader className="mb-4">
                  <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <DialogTitle className="text-center text-xl">בטוח שאתה רוצה לבטל?</DialogTitle>
                  <DialogDescription className="text-center text-sm leading-relaxed">
                    המנוי שלך יישאר פעיל עד 15/03/2026. לאחר מכן תאבד גישה לכל תכני הפרימיום.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2.5 mt-2">
                  <Button variant="destructive" className="w-full h-12 text-base font-bold rounded-xl" onClick={handleConfirmYes}>
                    כן, בטל את המנוי
                  </Button>
                  <Button variant="outline" className="w-full h-12 text-base rounded-xl" onClick={closeDialog}>
                    לא, השאר את המנוי
                  </Button>
                </div>
              </motion.div>}

            {/* Step 2: Survey */}
            {cancelStep === "survey" && <motion.div key="survey" initial={{
            opacity: 0,
            x: 30
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -30
          }} transition={{
            duration: 0.2
          }} className="p-6">
                <DialogHeader className="mb-5">
                  <DialogTitle className="text-center text-lg leading-relaxed">
                    המועדון נבנה כדי להנגיש AI לכולם
                  </DialogTitle>
                  <DialogDescription className="text-center text-sm leading-relaxed mt-2">
                    אבל אנחנו יודעים שלא תמיד זה הזמן, הקצב או הסיטואציה.
                    <br />
                    כדי שנדע איך להשתפר ולעזור — מה הסיבה העיקרית שבגללה החלטת לבטל?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2.5">
                  {reasonOptions.map(opt => <button key={opt.key} onClick={() => handleReasonSelect(opt.key)} className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 hover:border-primary/40 transition-all text-right group">
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-medium text-sm group-hover:text-primary transition-colors">{opt.label}</span>
                    </button>)}
                </div>
              </motion.div>}

            {/* Step 3: Personalized Offer */}
            {cancelStep === "offer" && cancelReason && cancelReason !== "other" && <motion.div key="offer" initial={{
            opacity: 0,
            x: 30
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -30
          }} transition={{
            duration: 0.2
          }} className="p-6">
                <DialogHeader className="mb-4">
                  <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Heart className="h-7 w-7 text-primary" />
                  </div>
                  <DialogTitle className="text-center text-lg">
                    {offerContent[cancelReason].title}
                  </DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-6 max-h-[40vh] overflow-y-auto px-1">
                  {offerContent[cancelReason].body}
                </div>
                <div className="flex flex-col gap-2.5">
                  <Button className="w-full h-12 text-base font-bold rounded-xl gradient-primary border-0" onClick={handleAcceptOffer}>
                    {offerContent[cancelReason].cta}
                  </Button>
                  <Button variant="ghost" className="w-full h-10 text-sm text-muted-foreground hover:text-destructive" onClick={handleFinalCancel}>
                    ❌ לבטל בכל זאת
                  </Button>
                </div>
              </motion.div>}

            {/* Step 4: Done */}
            {cancelStep === "done" && <motion.div key="done" initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.25
          }} className="p-6 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-2xl">🙏</span>
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center text-lg">המנוי בוטל בהצלחה</DialogTitle>
                  <DialogDescription className="text-center text-sm mt-2">
                    תודה שהיית חלק מהמועדון 🙏
                    <br />
                    הגישה שלך תישאר פעילה עד 15/03/2026.
                  </DialogDescription>
                </DialogHeader>
                <Button variant="outline" className="w-full h-11 rounded-xl mt-6" onClick={closeDialog}>
                  סגור
                </Button>
              </motion.div>}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>;
}
