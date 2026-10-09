"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Dialog } from "./dialog";
export function AgeGate() {
  const [open, setOpen] = useState(false);
  const [declined, setDeclined] = useState(false);
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    try {
      setOpen(sessionStorage.getItem("voyage-adult") !== "yes");
    } catch {
      setOpen(true);
    }
  }, [path]);
  function enter() {
    try {
      sessionStorage.setItem("voyage-adult", "yes");
    } catch {}
    setOpen(false);
  }
  return (
    <Dialog
      open={open && !path.startsWith("/admin")}
      label="Age confirmation"
      className="age-dialog"
    >
      <img
        src="/images/logo.png"
        alt="Voyage Advent"
        width="100"
        height="100"
      />
      <p className="eyebrow">A LITTLE DISCOVERY AWAITS</p>
      <h2>{declined ? "See you another time." : "Welcome to the voyage."}</h2>
      <p>
        {declined
          ? "This store is for adults aged 18 and over. Thank you for understanding."
          : "Our collection is for adults aged 18 and over. Please confirm your age to explore."}
      </p>
      {!declined && (
        <>
          <button className="button gold wide" onClick={enter}>
            I am 18 or older <ArrowUpRight size={18} />
          </button>
          <button
            className="text-button muted"
            onClick={() => setDeclined(true)}
          >
            I am under 18
          </button>
        </>
      )}
      {declined && (
        <a className="button gold" href="https://www.google.com">
          Leave this website <ArrowUpRight size={18} />
        </a>
      )}
      <small>Enjoy thoughtfully. Drink responsibly.</small>
    </Dialog>
  );
}
