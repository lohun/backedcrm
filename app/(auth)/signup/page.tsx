import { SignupForm } from '@/components/forms/signup-form'

export default function SignupPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Your Account</h1>
          <p className="text-muted-foreground">
            Set up your organization and create your super admin account.
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}