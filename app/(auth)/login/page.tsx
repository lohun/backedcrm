import { LoginForm } from '@/components/forms/login-form'

export default function LoginPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}