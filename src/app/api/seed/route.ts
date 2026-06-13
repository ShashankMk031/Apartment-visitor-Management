import { NextResponse } from 'next/server';

export async function GET() {
  // Return a success page or trigger mock database reset instruction
  return NextResponse.json({
    message: 'Mock Database automatically seeds on startup in-memory and in localStorage. You can clear your browser site data or cookies to reset the mock database state.',
    instructions: {
      step1: 'Ensure Supabase environment variables are NOT set in .env.local to run in mock mode.',
      step2: 'To reset state, open browser developer console and run: localStorage.clear(); document.cookie="mock_session=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT";',
      step3: 'Refresh the page.'
    }
  });
}
