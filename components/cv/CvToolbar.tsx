"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

type CvToolbarProps = {
  publicUrl: string | null;
  researcherName: string;
  /** default true when publicUrl is present */
  showShare?: boolean;
};

export function CvToolbar({
  publicUrl,
  researcherName,
  showShare,
}: CvToolbarProps) {
  const [copied, setCopied] = useState(false);
  const canShare = showShare ?? Boolean(publicUrl);

  const shareText = `السيرة الذاتية — ${researcherName}`;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePdf = useCallback(() => {
    // Browser "Save as PDF" via print dialog; document title helps filename
    const prev = document.title;
    document.title = `CV-${researcherName || "researcher"}`;
    window.print();
    // restore shortly after print dialog opens
    setTimeout(() => {
      document.title = prev;
    }, 1000);
  }, [researcherName]);

  const handleWhatsApp = useCallback(() => {
    if (!publicUrl) return;
    const text = encodeURIComponent(`${shareText}\n${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }, [publicUrl, shareText]);

  const handleTelegram = useCallback(() => {
    if (!publicUrl) return;
    const url = encodeURIComponent(publicUrl);
    const text = encodeURIComponent(shareText);
    window.open(
      `https://t.me/share/url?url=${url}&text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [publicUrl, shareText]);

  const handleCopy = useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = publicUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicUrl]);

  return (
    <div
      dir="rtl"
      className="cv-no-print sticky top-0 z-40 border-b border-[#1e3a5f]/15 bg-white/95 backdrop-blur-sm print:hidden"
    >
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <Button type="button" size="sm" onClick={handlePrint}>
          طباعة
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handlePdf}>
          حفظ PDF
        </Button>

        {canShare && publicUrl ? (
          <>
            <span className="mx-1 hidden h-5 w-px bg-[#1e3a5f]/20 sm:inline-block" aria-hidden />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleWhatsApp}
            >
              واتساب
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleTelegram}
            >
              تيليجرام
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopy}
            >
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
