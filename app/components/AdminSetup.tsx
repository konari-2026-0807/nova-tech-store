"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthButton } from "./AuthButton";

type SetupState = "checking" | "available" | "unavailable";

function setupErrorMessage(code: string) {
  if (code === "invalid_email") return "올바른 이메일 주소를 입력해주세요.";
  if (code === "invalid_password") return "비밀번호는 8자 이상 72자 이하로 입력해주세요.";
  if (code === "admin_already_configured") return "다른 관리자 설정이 먼저 완료되었습니다. 로그인해주세요.";
  if (code === "account_update_failed" || code === "account_create_failed") return "계정을 설정하지 못했습니다. 입력 내용을 확인해주세요.";
  return "관리자 계정을 설정하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

export function AdminSetup() {
  const [state, setState] = useState<SetupState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setState("unavailable");
      return;
    }

    void supabase.functions.invoke("admin-bootstrap", { method: "GET" }).then(({ data, error }) => {
      if (!active) return;
      setState(!error && data?.available === true ? "available" : "unavailable");
    });

    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!supabase) return;
    if (password.length < 8 || password.length > 72) {
      setError("비밀번호는 8자 이상 72자 이하로 입력해주세요.");
      return;
    }

    setLoading(true);
    const { data, error: setupError } = await supabase.functions.invoke("admin-bootstrap", {
      method: "POST",
      body: { email: email.trim(), password },
    });

    if (setupError || !data?.success) {
      setLoading(false);
      setError(setupErrorMessage(data?.error ?? "unknown"));
      if (data?.error === "admin_already_configured") setState("unavailable");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError("관리자 설정은 완료됐지만 자동 로그인하지 못했습니다. 로그인 버튼을 이용해주세요.");
      setState("unavailable");
      return;
    }

    setPassword("");
    setComplete(true);
  };

  if (state !== "available") {
    return (
      <aside className="admin-preview-banner">
        <div>
          <strong>보기 전용 미리보기</strong>
          <p>{state === "checking" ? "관리자 설정 상태를 확인하고 있습니다." : "상품 현황과 화면 구성은 로그인 없이 볼 수 있습니다. 주문·고객 정보와 변경 기능은 관리자에게만 표시됩니다."}</p>
        </div>
        {state === "checking" ? <LoaderCircle className="spin" size={20} /> : <AuthButton variant="button" />}
      </aside>
    );
  }

  return (
    <aside className="admin-preview-banner admin-setup-banner">
      <div className="admin-setup-copy">
        <span><KeyRound size={16} /> INITIAL ADMIN</span>
        <strong>{complete ? "관리자 설정이 완료되었습니다." : "새 관리자 계정을 설정해주세요."}</strong>
        <p>{complete ? "이메일 인증 없이 로그인되었습니다. 관리자 데이터를 불러오는 중입니다." : "이메일과 비밀번호만 입력하면 즉시 관리자 계정으로 설정되며, 인증 메일은 발송되지 않습니다."}</p>
      </div>
      {complete ? <CheckCircle2 className="admin-setup-complete" size={28} /> : (
        <form className="admin-setup-form" onSubmit={submit}>
          <label>
            <span>이메일</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="admin@example.com" required />
          </label>
          <label>
            <span>비밀번호</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="8자 이상 입력" minLength={8} maxLength={72} required />
          </label>
          {error && <p className="admin-setup-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? <><LoaderCircle className="spin" size={17} /> 설정 중</> : <>관리자 설정 <ArrowRight size={16} /></>}
          </button>
        </form>
      )}
    </aside>
  );
}
