import { login } from "@/app/actions";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual">
        <p className="eyebrow">Playbook Portal</p>
        <h1>One secure home for your operating system.</h1>
        <p>
          Members get read access. Admins can edit, draft, publish, and prepare
          content imported from Notion.
        </p>
      </section>
      <section className="login-panel">
        <div className="panel">
          <p className="eyebrow">Secure access</p>
          <h2>Log in</h2>
          <p className="muted">
            Use the admin or member password configured in your environment.
          </p>
          <LoginForm action={login} />
        </div>
      </section>
    </main>
  );
}
