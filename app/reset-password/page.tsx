"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { supabase } from "../../lib/supabase";

type RecoveryState = "loading" | "ready" | "invalid" | "complete";

export default function ResetPasswordPage() {
  const [state, setState] = useState<RecoveryState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setState("invalid");
      return;
    }

    let active = true;
    const recoveryInUrl = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"
      || new URLSearchParams(window.location.search).get("type") === "recovery";

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) setState("ready");
    });

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active) return;
      if (sessionData.session && recoveryInUrl) setState("ready");
      else if (!sessionData.session) setState("invalid");
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!supabase) return;
    if (password.length < 8) {
      setError("비밀번호는 8자 이상으로 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setSaving(false);
      setError("비밀번호를 변경하지 못했습니다. 복구 링크를 다시 요청해주세요.");
      return;
    }
    await supabase.auth.signOut({ scope: "global" });
    setSaving(false);
    setPassword("");
    setConfirmPassword("");
    setState("complete");
  };

  return (
    <main className="password-reset-page">
      <a className="password-reset-brand" href="/" aria-label="NOVA 홈"><img src="/images/brand/nova-logo.png" alt="NOVA" /></a>
      <section className="password-reset-card">
        {state === "loading" && <div className="password-reset-state"><LoaderCircle className="spin" size={28} /><p>안전한 복구 링크를 확인하는 중...</p></div>}

        {state === "invalid" && <div className="password-reset-state"><AlertTriangle size={30} /><p className="eyebrow">LINK EXPIRED</p><h1>복구 링크를<br />다시 요청해주세요.</h1><p>링크가 만료되었거나 올바르지 않습니다. 로그인 화면에서 새 재설정 링크를 받을 수 있어요.</p><a className="password-reset-primary" href="/"><ArrowLeft size={16} /> 로그인 화면으로</a></div>}

        {state === "complete" && <div className="password-reset-state"><CheckCircle2 size={34} /><p className="eyebrow">PASSWORD UPDATED</p><h1>새로운 비밀번호가<br />설정되었습니다.</h1><p>보안을 위해 기존 로그인 세션을 종료했습니다. 새 비밀번호로 다시 로그인해주세요.</p><a className="password-reset-primary" href="/">NOVA 로그인 <ArrowRight size={16} /></a></div>}

        {state === "ready" && <>
          <div className="password-reset-heading"><LockKeyhole size={29} /><p className="eyebrow">SECURE RECOVERY</p><h1>새 비밀번호를<br />설정해주세요.</h1><p>이전에 사용하지 않은 8자 이상의 비밀번호를 권장합니다.</p></div>
          <form className="password-reset-form" onSubmit={updatePassword}>
            <label><span>새 비밀번호</span><div><input type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="8자 이상 입력" required autoFocus /><button type="button" aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            <label><span>새 비밀번호 확인</span><div><input type={visible ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="한 번 더 입력" required /></div></label>
            <div className="password-strength"><span className={password.length >= 8 ? "active" : ""} /><span className={password.length >= 10 ? "active" : ""} /><span className={/[A-Z]|[^a-zA-Z0-9]/.test(password) && password.length >= 10 ? "active" : ""} /><em>{password.length < 8 ? "8자 이상 입력" : password.length < 10 ? "사용 가능" : "안전한 비밀번호"}</em></div>
            {error && <p className="password-reset-error" role="alert">{error}</p>}
            <button className="password-reset-primary" type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={18} /> 변경하는 중</> : <>비밀번호 변경 <ArrowRight size={16} /></>}</button>
          </form>
        </>}
      </section>
      <p className="password-reset-security">NOVA SECURE ACCOUNT RECOVERY · SUPABASE AUTH</p>
    </main>
  );
}
