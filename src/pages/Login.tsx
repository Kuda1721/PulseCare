import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { DOCTOR_ACCOUNTS, login } from '../store/authStore';
import { unlockUrgentAudio } from '../services/urgentAlarm';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DOCTOR_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DOCTOR_ACCOUNTS[0].password);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!login(email, password)) {
      setError('Use one of the demo doctor accounts below.');
      return;
    }
    unlockUrgentAudio();
    navigate('/dashboard', { replace: true });
  }

  return (
    <main className="min-h-full bg-[#07111F] text-white flex items-center justify-center p-5">
      <div className="w-full max-w-4xl grid lg:grid-cols-[1fr_0.8fr] gap-5">
        <section className="rounded-3xl border border-cyan-500/20 bg-[#0B1728] p-7 sm:p-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full border border-cyan-400/40 flex items-center justify-center text-cyan-300">+</div>
            <div><div className="font-bold tracking-[0.18em]">PULSECARE</div><div className="text-[10px] text-[#718198] uppercase tracking-[0.16em]">Clinical monitoring</div></div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Doctor sign in</h1>
          <p className="text-[#718198] text-sm mb-8">Access only the patients assigned to your clinical account.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs text-[#A7B5C7]">Email<input value={email} onChange={event => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-3 text-sm outline-none focus:border-cyan-400/60" /></label>
            <label className="block text-xs text-[#A7B5C7]">Password<input value={password} onChange={event => setPassword(event.target.value)} type="password" className="mt-2 w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-3 text-sm outline-none focus:border-cyan-400/60" /></label>
            {error && <p className="text-red-300 text-xs">{error}</p>}
            <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 text-[#07111F] font-semibold py-3 text-sm hover:bg-cyan-300 transition-colors"><LogIn size={16} /> Sign in</button>
          </form>
          <div className="mt-6 flex items-start gap-2 text-[11px] text-[#718198]"><ShieldCheck size={15} className="text-green-400 shrink-0" /> Demo access only. This interface is clinical decision support, not autonomous diagnosis or treatment.</div>
        </section>
        <section className="rounded-3xl border border-white/[0.08] bg-[#0B1728] p-7">
          <div className="flex items-center gap-2 text-amber-300 mb-4"><LockKeyhole size={16} /><h2 className="text-sm font-semibold">Demo doctor accounts</h2></div>
          <p className="text-[#718198] text-xs mb-5">Each account sees only its assigned patients.</p>
          <div className="space-y-3">{DOCTOR_ACCOUNTS.map(account => <button key={account.id} type="button" onClick={() => { setEmail(account.email); setPassword(account.password); setError(''); }} className="w-full text-left rounded-2xl border border-white/[0.08] p-4 hover:border-cyan-400/40 hover:bg-white/[0.03] transition-colors"><div className="text-white text-sm font-semibold">{account.name}</div><div className="text-[#718198] text-xs mt-1">{account.specialty}</div><div className="text-cyan-300/80 text-[10px] mt-2 font-mono">{account.email}</div><div className="text-[#718198] text-[10px] font-mono">Password: {account.password}</div></button>)}</div>
        </section>
      </div>
    </main>
  );
}