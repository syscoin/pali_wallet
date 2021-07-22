import format from 'date-fns/format';
import currency from 'currency.js';

export const ellipsis = (str: any, start = 7, end = 4) => {
  if (typeof str !== 'string') {
    return str;
  }

  return `${str.substring(0, start)}...${str.substring(
    str.length - end,
    str.length
  )}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

export const formatDistanceDate = (timestamp: string) => {
  const formatStyle = 'M-d-yyyy';
  const today = new Date();
  const yesterday = getYesterday();
  const formatedDate = format(new Date(timestamp), formatStyle);

  if (formatedDate === format(today, formatStyle)) return 'Today';
  if (formatedDate === format(yesterday, formatStyle)) return 'Yesterday';
  return formatedDate;
};

export const formatNumber = (num: number, min = 4, max = 4, maxSig = 12) => {
  return num.toLocaleString(navigator.language, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    maximumSignificantDigits: maxSig,
  });
};

export const formatCurrency = (number: string, precision: number) => {
  if (Number(number) < 1e-6) {
    number = Number(number).toFixed(precision)
  }

  return currency(number, { separator: ',', symbol: '', precision }).format();
};

export const formatURL = (url: string, size: number = 30) => {
  if (url.length >= size) {
    return `${url.slice(0, size)}...`;
  }

  return url;
};

export const sendMessage = (
  eventReceivedDetails: any,
  postMessageDetails: any
) => {
  return new Promise((resolve) => {
    const callback = (event: any) => {
      if (
        event.data.type === eventReceivedDetails.type &&
        event.data.target === eventReceivedDetails.target
      ) {
        resolve(
          eventReceivedDetails.freeze
            ? Object.freeze(event.data[eventReceivedDetails.eventResult])
            : event.data[eventReceivedDetails.eventResult]
        );

        console.log(
          'event result',
          eventReceivedDetails,
          event.data[eventReceivedDetails.eventResult]
        );

        window.removeEventListener('message', callback);

        return true;
      }

      return false;
    };

    window.addEventListener('message', callback);

    window.postMessage(postMessageDetails, '*');

    return true;
  });
};
