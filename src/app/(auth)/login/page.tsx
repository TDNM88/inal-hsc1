import { Suspense } from 'react';
import { SimpleLoginForm } from './simple-login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SimpleLoginForm />
    </Suspense>
  );
}