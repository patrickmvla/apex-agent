import { useEffect, useState } from "react";

export const CountdownTimer = ({ endTime }: { endTime: number }) => {
  const [timeLeft, setTimeLeft] = useState(endTime * 1000 - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(endTime * 1000 - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft <= 0) {
    return <span>00:00:00</span>;
  }

  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((timeLeft / 1000) % 60)
    .toString()
    .padStart(2, "0");

  return (
    <span>
      {hours}:{minutes}:{seconds}
    </span>
  );
};
