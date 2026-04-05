import { Fragment, useEffect, useMemo, useState } from "react";
import type { Lang } from "../lib/i18n";
import { translations } from "../lib/i18n";

type Step = "phone" | "people" | "seat" | "complete";
type Seat = "TABLE" | "COUNTER" | "EITHER";

const STORE_ID = "shibuya-001"; // TODO: make configurable

const MAX_PHONE = 11;
const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

const keypadBtnClass =
  "keypad-button w-full h-[80px] max-lg:h-14 bg-white text-[#082752] text-[28px] max-lg:text-[22px] font-bold rounded-[14px] border border-[#F1F5F9] shadow-sm hover:bg-[#FF8100] hover:text-white active:scale-[0.97] transition-colors transition-transform cursor-pointer";

function formatPhone(value: string) {
  if (value.length <= 3) return value;
  if (value.length <= 7) return `${value.slice(0, 3)}-${value.slice(3)}`;
  return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
}

function StepIndicatorPeople() {
  return (
    <div className="flex items-center gap-4 sm:gap-8 mb-6 sm:mb-10 text-xs">
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8100] text-xs font-semibold text-white">1</div>
        <span className="text-[#FF8100]">人数</span>
      </div>
      <div className="h-px w-16 bg-[#E0E5F0]" />
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#E0E5F0] text-xs font-semibold text-slate-500">2</div>
        <span className="text-slate-500">席の種類</span>
      </div>
      <div className="h-px w-16 bg-[#E0E5F0]" />
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#E0E5F0] text-xs font-semibold text-slate-500">3</div>
        <span className="text-slate-500">完了</span>
      </div>
    </div>
  );
}

function StepIndicatorSeat() {
  return (
    <div className="flex items-center gap-4 sm:gap-8 mb-6 sm:mb-10 text-xs">
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8100] text-xs font-semibold text-white">1</div>
        <span className="text-[#FF8100]">人数</span>
      </div>
      <div className="h-px w-16 bg-[#E0E5F0]" />
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8100] text-xs font-semibold text-white">2</div>
        <span className="text-[#FF8100]">席の種類</span>
      </div>
      <div className="h-px w-16 bg-[#E0E5F0]" />
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#E0E5F0] text-xs font-semibold text-slate-500">3</div>
        <span className="text-slate-500">完了</span>
      </div>
    </div>
  );
}

export default function KioskPage() {
  const [step, setStep] = useState<Step>("phone");
  const [lang, setLang] = useState<Lang>("ja");
  const [phone, setPhone] = useState("");
  const [showNotice, setShowNotice] = useState(false);
  const [people, setPeople] = useState(1);
  const [seat, setSeat] = useState<Seat>("EITHER");
  const [ticketNumber, setTicketNumber] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [currentTicket, setCurrentTicket] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const text = translations[lang];
  const canSubmitPhone = phone.length === MAX_PHONE;

  // Fetch initial queue stats
  useEffect(() => {
    fetch(`/api/queue?storeId=${STORE_ID}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) {
          setWaitingCount(data.stats.waitingCount);
          setEstimatedWait(data.stats.estimatedWait);
          setCurrentTicket(data.stats.currentTicket);
        }
      })
      .catch(() => {});
  }, [step]);

  useEffect(() => {
    if (step !== "complete") return;
    const timer = setTimeout(() => {
      setStep("phone");
      setPhone("");
      setPeople(1);
      setSeat("EITHER");
      setShowNotice(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, [step]);

  const displayPeople = useMemo(() => String(people), [people]);

  const appendPhone = (digit: string) => setPhone((prev) => (prev.length < MAX_PHONE ? `${prev}${digit}` : prev));
  const backPhone = () => setPhone((prev) => prev.slice(0, -1));
  const clearPhone = () => setPhone("");

  const appendPeople = (digit: string) => {
    const next = String(people === 0 ? "" : people) + digit;
    const parsed = Number.parseInt(next, 10) || 0;
    setPeople(Math.min(99, parsed));
  };
  const backPeople = () => {
    const v = String(people);
    setPeople(Math.max(0, v.length > 1 ? Number.parseInt(v.slice(0, -1), 10) : 0));
  };

  const submitPhone = async () => {
    if (!canSubmitPhone) return;
    try {
      await fetch("/api/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
    } catch {
      // continue flow if API unavailable
    } finally {
      setShowNotice(false);
      setStep("people");
    }
  };

  const seatButtonClass = (active: boolean) =>
    active
      ? "h-32 sm:h-40 rounded-[24px] sm:rounded-[32px] border border-[#FF8100]/40 bg-[#FFF5EC] text-sm font-semibold text-[#FF8100] shadow-[0_14px_30px_rgba(253,120,15,0.25)] sm:text-base"
      : "h-32 sm:h-40 rounded-[24px] sm:rounded-[32px] border border-[#E0E5F0] bg-white text-sm font-semibold text-[#082752] shadow-sm sm:text-base";

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-[#082752]">
      {/* ── Step 1: Phone number + wait info ── */}
      {step === "phone" && (
        <div className="flex h-screen min-h-0 overflow-hidden">
          {/* Left column: wait information */}
          <section className="relative flex w-1/2 min-w-0 flex-col items-center justify-center bg-[#082752] px-4 text-[#FF8100]">
            {/* Language selector pill */}
            <div className="absolute right-4 top-4 sm:right-10 sm:top-8">
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="appearance-none rounded-[50px] border border-white/40 bg-[#082752] px-4 py-2 pr-8 text-xs text-white transition-colors hover:text-[#0B1C38] sm:px-6 sm:text-[14px]"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                  <option value="es">Español</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/80">▼</span>
              </div>
            </div>

            {/* Wait info */}
            <div className="w-full text-center">
              <p className="mb-2 text-base font-bold tracking-wide text-white sm:mb-4 sm:text-xl">{text.waitLabel}</p>
              <div className="mb-4 flex items-end justify-center gap-1 sm:mb-6 sm:gap-2">
                <span className="text-[100px] font-bold leading-none text-[#FF8100] sm:text-[130px] lg:text-[150px]">{waitingCount}</span>
                <span className="mb-2 text-xl text-[#FF8100] sm:mb-3 sm:text-2xl">{text.groupUnit}</span>
              </div>
              <div className="time-estimate mt-2 inline-flex items-center justify-center rounded-full px-4 py-1 text-base tracking-wide text-white sm:px-8 sm:text-lg">
                <span>{text.estimateLabel}</span>
                <span className="mx-1">{estimatedWait || 20}</span>
                <span>{text.minuteUnit}</span>
              </div>
            </div>
          </section>

          {/* Right column: phone keypad */}
          <section className="right-column flex w-1/2 min-w-0 flex-col items-center bg-[#F7F8FA]">
            <div className="flex min-h-0 w-full max-w-[512px] flex-1 flex-col items-center px-4 py-6 sm:px-8">
              {/* Heading */}
              <p className="text-input mb-4 mt-4 max-w-full text-center text-xl font-bold leading-tight text-[#082752] sm:mb-8 sm:mt-8 max-lg:text-lg">
                {text.heading.split("\n").map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </Fragment>
                ))}
              </p>

              {/* Input */}
              <div className="mb-4 flex w-full flex-col items-center gap-2 sm:mb-8">
                <div className="relative h-[100px] w-full max-w-[442px] sm:h-[120px]">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    readOnly
                    value={formatPhone(phone)}
                    className="h-full w-full translate-x-0 rounded-[16px] border border-[#B0B0B0] bg-white px-4 py-4 text-center text-[32px] font-bold tracking-tight text-[#082752] shadow-sm transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF8100] sm:px-8 sm:text-[42px] caret-[#FF8100]"
                  />
                  <p
                    className={`phone-number-input pointer-events-none absolute inset-0 flex items-center justify-center text-xs sm:text-sm ${phone.length > 0 ? "hidden" : "flex"}`}
                  >
                    {text.phonePlaceholder}
                  </p>
                </div>
              </div>

              {/* Keypad */}
              <div className="keypad mb-4 grid min-h-0 w-full max-w-[442px] flex-1 grid-cols-3 content-center gap-2 sm:gap-3">
                {keypad.map((k, idx) =>
                  k ? (
                    <button
                      key={`${k}-${idx}`}
                      type="button"
                      className={keypadBtnClass}
                      onClick={() => {
                        if (k === "←") backPhone();
                        else appendPhone(k);
                      }}
                      onContextMenu={(e) => {
                        if (k === "←") {
                          e.preventDefault();
                          clearPhone();
                        }
                      }}
                    >
                      {k}
                    </button>
                  ) : (
                    <div key={`blank-${idx}`} />
                  )
                )}
              </div>

              {/* Bottom buttons */}
              <div className="mt-auto flex w-full max-w-[442px] gap-3 pb-4 sm:gap-4 sm:pb-8">
                <button
                  type="button"
                  onClick={clearPhone}
                  className="flex-1 rounded-[16px] border border-slate-100 bg-white py-5 text-lg font-bold text-[#082752] shadow-sm transition-all active:bg-slate-50 sm:py-7 sm:text-xl"
                >
                  {text.cancel}
                </button>
                <button
                  type="button"
                  disabled={!canSubmitPhone}
                  onClick={() => canSubmitPhone && setShowNotice(true)}
                  className={`flex-1 rounded-[16px] py-5 text-lg font-bold shadow-lg transition-all active:scale-[0.98] sm:py-7 sm:text-xl ${
                    canSubmitPhone ? "bg-[#fd780f] text-white hover:bg-[#e66c0d]" : "cursor-not-allowed bg-[#E0E5F0] text-slate-400"
                  }`}
                >
                  {text.ok}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Notice modal ── */}
      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-white px-6 py-8 shadow-2xl sm:rounded-[32px] sm:px-12 sm:py-10">
            <h2 className="mb-6 text-center text-2xl font-bold text-[#001133]">{text.noticeHeading}</h2>
            <ul className="mb-6 space-y-3 text-sm leading-relaxed text-[#001133]">
              {text.noticeLines.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#FF8100]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mb-8 text-center text-sm font-semibold text-[#FF8100]">{text.noticeFooter}</p>
            <div className="mt-4 flex justify-center gap-8">
              <button
                type="button"
                onClick={() => setShowNotice(false)}
                className="notice-back-button min-w-[200px] rounded-lg bg-[#f0f0f0] px-8 py-4 text-center text-[1.2rem] font-bold text-[#082752]"
              >
                {text.back}
              </button>
              <button
                type="button"
                onClick={submitPhone}
                className="agree-button min-w-[200px] rounded-xl bg-[#ff8100] px-8 py-4 text-center text-[1.2rem] font-bold text-white hover:bg-[#ff6a00]"
              >
                {text.noticeAgree}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: People count ── */}
      {step === "people" && (
        <div className="flex h-screen flex-col items-center overflow-auto bg-white pt-6 sm:pt-12">
          <StepIndicatorPeople />
          <h1 className="my-6 px-2 text-center text-xl font-bold tracking-wide text-[#082752] sm:my-10 sm:text-2xl">{text.peopleHeading}</h1>
          <div className="flex min-h-0 w-[90%] max-w-4xl flex-1 flex-col gap-6 lg:flex-row">
            {/* Left: count display */}
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mb-4 flex h-[120px] w-full max-w-[260px] items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm sm:h-[140px]">
                <span className="text-[60px] font-bold leading-none text-[#082752] sm:text-[80px]">{displayPeople}</span>
              </div>
              <span className="mb-2 block text-xl font-bold text-[#082752] sm:text-2xl">{text.peopleUnit}</span>
              <p className="text-xs text-slate-400">{text.peopleNote}</p>
            </div>
            {/* Right: keypad */}
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div id="people-keypad" className="mb-6 grid w-full max-w-[442px] grid-cols-3 gap-2 sm:mb-8 sm:gap-3">
                {keypad.map((k, idx) =>
                  k ? (
                    <button key={`p-${k}-${idx}`} type="button" className={keypadBtnClass} onClick={() => (k === "←" ? backPeople() : appendPeople(k))}>
                      {k}
                    </button>
                  ) : (
                    <div key={`pb-${idx}`} />
                  )
                )}
              </div>
            </div>
          </div>
          <div className="mb-8 mt-4 flex w-full max-w-[512px] gap-3 px-4 sm:mb-12 sm:gap-4">
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="flex-1 rounded-[16px] border border-slate-100 bg-white py-5 text-lg font-bold text-[#082752] shadow-sm transition-all active:bg-slate-50 sm:py-7 sm:text-xl"
            >
              {text.back}
            </button>
            <button
              type="button"
              onClick={() => setStep("seat")}
              className="flex-1 rounded-[16px] bg-[#fd780f] py-5 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] hover:bg-[#e66c0d] sm:py-7 sm:text-xl"
            >
              {text.next}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Seat type ── */}
      {step === "seat" && (
        <div className="flex h-screen flex-col items-center overflow-auto bg-white pt-6 sm:pt-12">
          <StepIndicatorSeat />
          <h1 className="my-6 px-2 text-center text-xl font-bold tracking-wide text-[#082752] sm:my-10 sm:text-2xl">{text.seatHeading}</h1>
          <div className="flex min-h-0 w-[90%] max-w-4xl flex-1 flex-col items-center justify-between">
            <div className="mb-6 grid w-full max-w-4xl grid-cols-3 gap-3 sm:mb-10 sm:gap-6">
              <button type="button" className={seatButtonClass(seat === "TABLE")} onClick={() => setSeat("TABLE")}>
                {text.seatTable}
              </button>
              <button type="button" className={seatButtonClass(seat === "COUNTER")} onClick={() => setSeat("COUNTER")}>
                {text.seatCounter}
              </button>
              <button type="button" className={seatButtonClass(seat === "EITHER")} onClick={() => setSeat("EITHER")}>
                {text.seatEither}
              </button>
            </div>
            <div className="mb-6 mt-4 flex w-full max-w-[512px] gap-3 px-4 sm:mb-10 sm:mt-6 sm:gap-4">
              <button
                type="button"
                onClick={() => setStep("people")}
                className="flex-1 rounded-[16px] border border-slate-100 bg-white py-5 text-lg font-bold text-[#082752] shadow-sm transition-all active:bg-slate-50 sm:py-7 sm:text-xl"
              >
                {text.back}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const res = await fetch("/api/queue", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ storeId: STORE_ID, adults: people, children: 0, seatType: seat, phone }),
                    });
                    const data = await res.json();
                    if (data.entry) {
                      setTicketNumber(data.entry.ticketNumber);
                    }
                    if (data.stats) {
                      setWaitingCount(data.stats.waitingCount);
                      setEstimatedWait(data.stats.estimatedWait);
                      setCurrentTicket(data.stats.currentTicket);
                    }
                  } catch {
                    // continue even if API fails
                  } finally {
                    setIsSubmitting(false);
                    setStep("complete");
                  }
                }}
                className="flex-1 rounded-[16px] bg-[#fd780f] py-5 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] hover:bg-[#e66c0d] sm:py-7 sm:text-xl disabled:opacity-70"
              >
                {isSubmitting ? "登録中..." : text.next}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Complete ── */}
      {step === "complete" && (
        <div className="flex h-screen flex-col items-center justify-center overflow-auto bg-[#F5F8FF]">
          <div className="flex min-h-0 w-[90%] max-w-5xl flex-col items-stretch gap-8 py-8 lg:flex-row lg:gap-16">
            {/* Left: LINE message */}
            <div className="flex flex-1 flex-col justify-between rounded-[24px] px-6 py-8 sm:rounded-[32px] sm:px-16 sm:py-12">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#06C755] sm:mb-6 sm:h-20 sm:w-20 sm:rounded-2xl">
                  <span className="text-lg font-bold text-white sm:text-xl">LINE</span>
                </div>
                <p className="mb-1 text-sm text-[#0A1F44]">順番待ちが登録されました</p>
                <p className="complete-main-title mb-4 font-bold leading-snug text-[#082752]">LINEを必ずご確認ください！</p>
                <p className="mb-4 inline-block rounded-full bg-[#FFECEF] px-4 py-2 text-xs text-[#FF2D55] sm:px-6">（通知をONにしてお待ちください）</p>
                <p className="complete-sub-text mt-2 font-bold text-[#0A1F44]">順番になりましたら、LINEでお知らせします</p>
              </div>
              <div className="mt-6 flex flex-col items-center sm:mt-10">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setPhone("");
                    setPeople(1);
                    setSeat("EITHER");
                  }}
                  className="h-[64px] w-full max-w-[340px] rounded-[40px] border border-[#E0E5F0] bg-white text-base font-bold text-[#001133] shadow-sm transition-transform hover:bg-slate-50 active:scale-[0.98] sm:h-[80px] sm:text-[18px]"
                >
                  トップに戻る
                </button>
              </div>
            </div>

            {/* Right: entry number card */}
            <div className="flex min-w-0 flex-1 flex-col items-center justify-between border border-[#E0E5F0] bg-[#FCFDFF] px-6 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:rounded-[32px] sm:px-16 sm:py-12">
              <div className="flex w-full flex-col items-center text-center">
                <p className="mb-2 text-xs tracking-[0.25em] text-slate-400 sm:mb-4">{text.entry}</p>
                <div className="mb-4 flex items-end justify-center gap-2 sm:mb-6 sm:gap-3">
                  <span className="entry-number text-[#FF8100]">{ticketNumber}</span>
                  <span className="text-xl font-bold text-[#FF8100] sm:text-2xl">番</span>
                </div>
                <div className="mb-4 h-px w-full bg-[#E0E5F0] sm:mb-8" />
                <p className="complete-call-text mb-3 flex items-center justify-center gap-1 font-bold text-[#0A1F44]">
                  現在の呼び出し
                  <span className="text-[#FF8100]">{currentTicket ?? "-"}</span>
                  番
                </p>
                <div className="wait-pill-text mt-2 inline-flex items-center justify-center rounded-full bg-[#F5F8FF] px-8 py-3 font-semibold text-[#001133]">
                  現在の順番待ち：<span className="ml-1 text-[#FF8100]">{waitingCount}組</span>
                </div>
                <div className="wait-pill-text mt-2 inline-flex items-center justify-center rounded-full bg-[#F5F8FF] px-8 py-3 font-semibold text-[#001133]">
                  目安待ち時間：約<span className="ml-1">{estimatedWait}分</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-[10px] text-slate-400">{text.autoBack}</p>
        </div>
      )}
    </main>
  );
}
