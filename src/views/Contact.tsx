'use client';

import { useState } from "react";
import { Mail, MessageCircle, Send, Star, MessageSquareHeart } from "lucide-react";
import { club } from "@/config/club";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    if (!rating) {
      toast.error("אנא בחרו דירוג");
      return;
    }
    if (!feedback.trim()) {
      toast.error("אנא כתבו משוב");
      return;
    }
    if (rating === 5) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
    }
    toast.success("תודה על המשוב!", { description: rating === 5 ? "וואו, שמחים שאהבתם! 🎉" : "נקרא אותו בקפידה 🙏" });
    setName("");
    setEmail("");
    setFeedback("");
    setRating(0);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.45 }} className="gradient-hero rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">צור קשר ותמיכה</h1>
            <p className="text-white/70 text-sm">אנחנו כאן לעזור! פנו אלינו בכל עת.</p>
          </div>
        </div>
      </motion.div>

      {/* Contact cards */}
      <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.1 }} className="grid gap-4 sm:grid-cols-2 mb-8">
        <a href={`mailto:${club.supportEmail}`} className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 flex items-center gap-4 hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 hover:scale-[1.02] transition-all duration-300">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">תמיכה במייל</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{club.supportEmail}</p>
          </div>
        </a>
        <a href="#" className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 flex items-center gap-4 hover:shadow-[var(--shadow-elevated)] hover:border-success/20 hover:scale-[1.02] transition-all duration-300">
          <div className="h-12 w-12 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
            <MessageCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="font-bold text-sm">בוט WhatsApp</p>
            <p className="text-xs text-muted-foreground">תשובות מהירות בצ׳אט</p>
          </div>
        </a>
      </motion.div>

      {/* Feedback section */}
      <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.2 }} className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 card-shadow border border-border/50">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquareHeart className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold">שלחו לנו משוב</h2>
        </div>

        {/* Star rating */}
        <div className="mb-5">
          <p className="text-sm text-muted-foreground mb-2">איך הייתם מדרגים את החוויה?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform duration-150 hover:scale-125"
              >
                <Star
                  className={`h-7 w-7 transition-colors duration-150 ${
                    star <= (hoverRating || rating)
                      ? "text-warning fill-warning"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="השם שלך" className="bg-secondary/60 border-0 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="כתובת אימייל" className="bg-secondary/60 border-0 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Textarea
            placeholder="מה דעתכם על האתר? מה אפשר לשפר?"
            className="bg-secondary/60 border-0 min-h-[120px] rounded-xl"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <Button className="gap-2 rounded-xl" onClick={handleSubmit}>
            <Send className="h-4 w-4" /> שלח משוב
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
