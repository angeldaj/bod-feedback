// Ambient colored glow behind the pop cards. Scoped per-page (not global) so
// the dashboard keeps its original single-ember look. Purely decorative.
export function PopScene({ tone = "warm" }: { tone?: "warm" | "urgent" }) {
  return (
    <div className="pop-scene" aria-hidden="true">
      {tone === "warm" ? (
        <>
          <span className="pop-blob pop-blob--gold left-[-10%] top-[-8%] h-[46vh] w-[46vh]" />
          <span className="pop-blob pop-blob--coral right-[-12%] top-[6%] h-[42vh] w-[42vh]" />
          <span className="pop-blob pop-blob--ember bottom-[-10%] left-[28%] h-[40vh] w-[40vh]" />
        </>
      ) : (
        <>
          <span className="pop-blob pop-blob--coral left-[-8%] top-[-6%] h-[48vh] w-[48vh]" />
          <span className="pop-blob pop-blob--ember right-[-10%] top-[10%] h-[40vh] w-[40vh]" />
          <span className="pop-blob pop-blob--gold bottom-[-12%] left-[34%] h-[34vh] w-[34vh] opacity-30" />
        </>
      )}
    </div>
  );
}
