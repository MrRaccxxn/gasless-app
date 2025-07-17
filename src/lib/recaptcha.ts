const _RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET!;

interface _RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export class _RecaptchaService {
  async verifyToken(token: string, remoteip?: string): Promise<boolean> {
    // reCAPTCHA is disabled - always return true
    console.log("reCAPTCHA verification disabled, auto-approving token:", token, remoteip);
    return true;

    // Original implementation commented out
    // try {
    //   const params = new URLSearchParams({
    //     secret: RECAPTCHA_SECRET,
    //     response: token,
    //   });

    //   if (remoteip) {
    //     params.append('remoteip', remoteip);
    //   }

    //   const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //     body: params.toString(),
    //   });

    //   if (!response.ok) {
    //     console.error('reCAPTCHA verification request failed:', response.status);
    //     return false;
    //   }

    //   const data: RecaptchaResponse = await response.json();
    //
    //   if (!data.success) {
    //     console.error('reCAPTCHA verification failed:', data['error-codes']);
    //     return false;
    //   }

    //   return true;
    // } catch (error) {
    //   console.error('Error verifying reCAPTCHA:', error);
    //   return false;
    // }
  }
}

//export const recaptchaService = new RecaptchaService();
