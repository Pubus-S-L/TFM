import { useCallback, useEffect, useState } from 'react';
import { useLinkedInType } from './types';
import { LINKEDIN_OAUTH2_STATE } from './utilsLinkedin.ts';

const getPopupPositionProperties = ({ width = 600, height = 600 }) => {
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    return `left=${left},top=${top},width=${width},height=${height}`;
  };

const generateRandomString = (length = 20) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export function useLinkedIn({
  redirectUri,
  clientId,
  onSuccess,
  onError,
  scope = 'openid profile email',
  state = '',
  closePopupMessage = 'User closed the popup',
}: useLinkedInType) {
  const [popup, setPopup] = useState<Window | null>(null);
  const [popUpInterval, setPopUpInterval] = useState<number | null>(null);

  const receiveMessage = useCallback(
    (event: MessageEvent) => {
      const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);
      if (event.origin === window.location.origin) {
        if (event.data.errorMessage && event.data.from === 'Linked In') {
          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            popup && popup.close();
            return;
          }
          onError && onError(event.data);
          popup && popup.close();
        } else if (event.data.code && event.data.from === 'Linked In') {
          // Prevent CSRF attack by testing state
          if (event.data.state !== savedState) {
            console.error('State does not match');
            popup && popup.close();
            return;
          }
          onSuccess && onSuccess(event.data.code);
          popup && popup.close();
        }
      }
    },
    [onError, onSuccess, popup],
  );

  useEffect(() => {
    window.addEventListener('message', receiveMessage, false);
    return () => {
      window.removeEventListener('message', receiveMessage, false);
    };
  }, [receiveMessage]);

  const getUrl = () => {
    const scopeParam = `&scope=${encodeURI(scope)}`;
    const generatedState = state || generateRandomString();
    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);
    const linkedInAuthLink = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}${scopeParam}&state=${generatedState}`;
    return linkedInAuthLink;
  };

  const linkedInLogin = () => {
    if (popup) {
      popup.close();
    }

    const newPopup = window.open(
      getUrl(),
      '_blank',
      getPopupPositionProperties({ width: 600, height: 600 }),
    );

    const newPopUpInterval = window.setInterval(() => {
      try {
        if (newPopup && newPopup.closed) {
          clearInterval(newPopUpInterval);
          if (onError) {
            onError({
              error: 'user_closed_popup',
              errorMessage: closePopupMessage,
            });
          }
        }
      } catch (error) {
        console.error(error);
        clearInterval(newPopUpInterval);
      }
    }, 1000);

    setPopup(newPopup);
    setPopUpInterval(newPopUpInterval);
  };

  return {
    linkedInLogin,
  };
}
