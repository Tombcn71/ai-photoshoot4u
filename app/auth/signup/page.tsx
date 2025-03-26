import SimpleSignUp from "@/components/auth/simple-signup";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign up to get started
          </p>
        </div>

        <SimpleSignUp />
      </div>
    </div>
  );
}
