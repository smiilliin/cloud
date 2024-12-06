import { jwtDecode } from "jwt-decode";
import { GlobalCtx } from "./App";

interface IStatusResponse {
  status: boolean;
  reason: string;
}

async function newAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://index-back.${process.env.REACT_APP_URL}/access`,
      {
        credentials: "include",
        method: "POST",
      }
    );
    const body = await res.json();

    if (!body.status) {
      return null;
    }

    if (body.lifespan < 1000 * 60 * 60 * 24 * 3) {
      if (!refreshRefreshToken()) {
        return null;
      }
    }

    return body.access;
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function checkAccessToken(context: GlobalCtx): Promise<string | null> {
  const { accessToken } = context;

  try {
    if (
      !accessToken ||
      jwtDecode<{ expires: number }>(accessToken).expires - Date.now() <
        1000 * 60 * 15
    ) {
      const token = await newAccessToken();

      context.setAccessToken(token);
      return token;
    }
    return accessToken;
  } catch (err) {
    console.error(err);
    return null;
  }
}
async function refreshRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(
      `https://index-back.${process.env.REACT_APP_URL}/access`,
      {
        credentials: "include",
        method: "POST",
      }
    );
    const data = await res.json();

    return data.status;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export { checkAccessToken, refreshRefreshToken, newAccessToken };

export type { IStatusResponse };
