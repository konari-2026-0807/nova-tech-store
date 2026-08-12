"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, CheckCircle2, CircleUserRound, LayoutDashboard, LoaderCircle, LogOut, MapPin, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type AuthMode = "login" | "signup" | "forgot";

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "이메일 또는 비밀번호를 다시 확인해주세요.";
  if (normalized.includes("email not confirmed")) return "이메일 인증을 완료한 뒤 로그인해주세요.";
  if (normalized.includes("user already registered")) return "이미 가입된 이메일입니다. 로그인해주세요.";
  if (normalized.includes("password")) return "비밀번호는 8자 이상으로 입력해주세요.";
  if (normalized.includes("rate limit")) return "요청이 많습니다. 잠시 후 다시 시도해주세요.";
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

export function AuthButton({ variant = "icon" }: { variant?: "icon" | "button" }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsAdmin(false);
    if (!supabase || !user) return;
    void supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (active) setIsAdmin(Boolean(data));
    });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const displayName = useMemo(() => {
    const metadataName = user?.user_metadata?.full_name;
    return typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : user?.email?.split("@")[0] ?? "NOVA 회원";
  }, [user]);

  const initial = displayName.slice(0, 1).toUpperCase();
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
    setPassword("");
    setPasswordConfirm("");
    window.requestAnimationFrame(() => overlayRef.current?.scrollTo({ top: 0, behavior: "auto" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!supabase) {
      setError("인증 서비스 연결 정보를 확인해주세요.");
      return;
    }
    if (mode === "forgot") {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (resetError) {
        setError(authErrorMessage(resetError.message));
        return;
      }
      setNotice("비밀번호 재설정 링크를 이메일로 보냈습니다. 받은편지함을 확인해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상으로 입력해주세요.");
      return;
    }
    if (mode === "signup" && password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          setOpen(false);
        } else {
          setNotice("가입 확인 메일을 보냈습니다. 이메일의 인증 링크를 눌러 가입을 완료해주세요.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        setOpen(false);
      }
      setPassword("");
      setPasswordConfirm("");
    } catch (caught) {
      setError(authErrorMessage(caught instanceof Error ? caught.message : "unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    setLoading(false);
    if (signOutError) {
      setError(authErrorMessage(signOutError.message));
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`${variant === "icon" ? "icon-button account-button" : "auth-trigger-button"}${user ? " is-authenticated" : ""}`}
        aria-label={user ? `${displayName} 계정 열기` : "로그인 또는 회원가입"}
        onClick={() => setOpen(true)}
      >
        {variant === "button" ? <><CircleUserRound size={17} />{user ? `${displayName} 계정` : "로그인 / 회원가입"}</> : user ? <span className="account-initial">{initial}</span> : <CircleUserRound size={19} />}
      </button>

      {open && portalTarget && createPortal(
        <div ref={overlayRef} className="overlay auth-overlay" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button type="button" className="auth-close" aria-label="계정 창 닫기" onClick={() => setOpen(false)}><X size={20} /></button>

            {user ? (
              <div className="auth-profile">
                <p className="eyebrow">NOVA ACCOUNT</p>
                <div className="auth-profile-avatar">{initial}</div>
                <h2 id="auth-title">반가워요,<br />{displayName}님.</h2>
                <p>{user.email}</p>
                <div className="auth-signed-in"><CheckCircle2 size={15} /> 로그인 상태입니다</div>
                <div className="auth-account-links">
                  <a className="auth-admin-link" href="/mypage"><MapPin size={16} /> 마이페이지 <ArrowRight size={15} /></a>
                  {isAdmin && <a className="auth-admin-link" href="/admin"><LayoutDashboard size={16} /> 관리자 콘솔 <ArrowRight size={15} /></a>}
                </div>
                {error && <p className="auth-message error" role="alert">{error}</p>}
                <button type="button" className="auth-submit auth-signout" onClick={handleSignOut} disabled={loading}>
                  {loading ? <LoaderCircle className="spin" size={18} /> : <LogOut size={17} />} 로그아웃
                </button>
              </div>
            ) : (
              <>
                <div className="auth-heading">
                  <p className="eyebrow">NOVA MEMBERSHIP</p>
                  <h2 id="auth-title">{mode === "login" ? <>다시 만나서<br />반가워요.</> : mode === "signup" ? <>NOVA를 더<br />가깝게.</> : <>다시 시작할<br />수 있어요.</>}</h2>
                  <p>{mode === "login" ? "회원 전용 경험을 이어서 만나보세요." : mode === "signup" ? "신제품과 특별한 혜택을 가장 먼저 만나보세요." : "가입한 이메일로 안전한 비밀번호 재설정 링크를 보내드릴게요."}</p>
                </div>

                {mode !== "forgot" && <div className="auth-tabs" role="tablist" aria-label="계정 메뉴">
                  <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")}>로그인</button>
                  <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => changeMode("signup")}>회원가입</button>
                </div>}

                <form className={`auth-form${mode === "forgot" ? " auth-recovery-form" : ""}`} onSubmit={handleSubmit}>
                  {mode === "signup" && <label><span>이름</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="홍길동" required /></label>}
                  <label><span>이메일</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required autoFocus={mode === "login" || mode === "forgot"} /></label>
                  {mode !== "forgot" && <label><span>비밀번호</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="8자 이상 입력" minLength={8} required /></label>}
                  {mode === "signup" && <label><span>비밀번호 확인</span><input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} autoComplete="new-password" placeholder="비밀번호를 다시 입력" minLength={8} required /></label>}
                  {mode === "login" && <button className="auth-forgot-button" type="button" onClick={() => changeMode("forgot")}>비밀번호를 잊으셨나요?</button>}

                  {!isSupabaseConfigured && <p className="auth-message error" role="alert">인증 서비스 환경 변수가 설정되지 않았습니다.</p>}
                  {error && <p className="auth-message error" role="alert">{error}</p>}
                  {notice && <p className="auth-message success" role="status"><CheckCircle2 size={15} /> {notice}</p>}

                  <button type="submit" className="auth-submit" disabled={loading || !isSupabaseConfigured}>
                    {loading ? <LoaderCircle className="spin" size={19} /> : <>{mode === "login" ? "로그인" : mode === "signup" ? "회원가입" : "재설정 링크 보내기"}<ArrowRight size={17} /></>}
                  </button>
                  {mode === "forgot" && <button className="auth-back-button" type="button" onClick={() => changeMode("login")}><ArrowRight size={14} /> 로그인으로 돌아가기</button>}
                </form>
                <p className="auth-policy">{mode === "forgot" ? "보안을 위해 가입 여부와 관계없이 동일한 안내를 표시합니다." : "계속하면 NOVA의 이용약관 및 개인정보처리방침에 동의하게 됩니다."}</p>
              </>
            )}
          </section>
        </div>,
        portalTarget,
      )}
    </>
  );
}
