import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ShieldCheck, Scale } from "lucide-react";
import { COMPANY, companyLine } from "@/lib/company";

type Section = { title: string; paragraphs: string[]; items?: string[] };

const privacy: Section[] = [
  { title: "1. Quién trata tus datos", paragraphs: ["El responsable del tratamiento de los datos de Bodega Club es " + companyLine + ", con domicilio fiscal en " + COMPANY.fiscalAddress + ", Venezuela. Para consultas o solicitudes relacionadas con tus datos, escríbenos por WhatsApp o Instagram desde los enlaces de nuestra página, o acércate a cualquiera de nuestras sucursales."] },
  { title: "2. Qué información podemos recopilar", paragraphs: ["Cuando creas una cuenta o usas el club, podemos tratar los datos que nos proporcionas y los necesarios para administrar tu membresía:"], items: ["Identificación: nacionalidad y número de cédula.", "Cuenta: correo electrónico, nombre de usuario y credenciales de acceso.", "Perfil opcional: fecha de cumpleaños, preferencias y otros datos que decidas agregar.", "Actividad del club: puntos acumulados y canjeados, recompensas, compras asociadas a tu cuenta y código de referido, cuando corresponda.", "Comunicaciones: tus preferencias de contacto y los mensajes que nos envíes."] },
  { title: "3. Para qué usamos la información", paragraphs: ["Usamos tus datos para crear y proteger tu cuenta; identificar tu membresía; registrar puntos, beneficios y canjes; atender solicitudes; y comunicar información necesaria sobre el funcionamiento del club. Si lo autorizas, también podremos enviarte novedades, promociones y comunicaciones comerciales por los canales que hayas elegido. Puedes retirar esa autorización para comunicaciones promocionales en cualquier momento.", "La fecha de cumpleaños y las preferencias se usan para personalizar beneficios o comunicaciones cuando esa función esté disponible. No son necesarias para crear la cuenta salvo que una promoción concreta indique lo contrario."] },
  { title: "4. Acceso y proveedores", paragraphs: ["El personal autorizado de La Bodega puede acceder a la información en la medida necesaria para operar el programa y atenderte. La plataforma puede apoyarse en proveedores que prestan servicios de alojamiento, autenticación, comunicaciones o soporte técnico. Estos proveedores solo deben recibir la información necesaria para prestar el servicio correspondiente.", "No vendemos tus datos personales. Podremos comunicarlos cuando sea necesario para prestar una función que solicites, cumplir una obligación legal o proteger los derechos y la seguridad de las personas y del servicio."] },
  { title: "5. Conservación y seguridad", paragraphs: ["Conservamos la información mientras tu cuenta permanezca activa y durante el tiempo adicional que resulte necesario para atender obligaciones, resolver disputas o mantener registros de la actividad del programa. Aplicamos medidas razonables para proteger la información; ningún sistema de transmisión o almacenamiento puede garantizar seguridad absoluta."] },
  { title: "6. Tus solicitudes", paragraphs: ["Puedes solicitar acceso a los datos vinculados con tu cuenta, pedir que se corrijan, actualizar tus preferencias promocionales o solicitar el cierre de tu membresía. Para hacerlo, escríbenos por WhatsApp o Instagram, o acércate a una sucursal, e indica qué necesitas. Te pediremos tu cédula para confirmar que la cuenta es tuya. Podremos pedir información razonable para verificar tu identidad antes de atender la solicitud."] },
  { title: "7. Cambios a esta política", paragraphs: ["Podemos actualizar esta política cuando cambien el programa, sus funciones o las reglas aplicables. Publicaremos la versión vigente en esta página e indicaremos su fecha de actualización."] },
];

const terms: Section[] = [
  { title: "1. Sobre Bodega Club", paragraphs: ["Bodega Club es el programa de fidelidad de La Bodega, disponible para personas que creen una cuenta y acepten estas condiciones. La inscripción no tiene costo. El operador del programa es " + companyLine + ", con domicilio fiscal en " + COMPANY.fiscalAddress + ", Venezuela."] },
  { title: "2. Cuenta y uso", paragraphs: ["Debes proporcionar información correcta, mantener tus credenciales en privado y avisarnos si sospechas que alguien accedió a tu cuenta. La cuenta es personal y no debe transferirse ni usarse para actividades fraudulentas o que interfieran con el programa.", "Podemos pedir que corrijas información incompleta o inconsistente para verificar una cuenta o una operación. Podemos limitar o suspender el acceso si detectamos uso indebido, fraude o un incumplimiento de estas condiciones, procurando informarte cuando sea posible."] },
  { title: "3. Puntos y recompensas", paragraphs: ["La acumulación, los puntos requeridos, las recompensas y los canales participantes se informan en Bodega Club o en los establecimientos de La Bodega. La referencia publicada de un punto por cada dólar consumido es ilustrativa; la acumulación efectiva, los productos participantes y cualquier conversión aplicable se mostrarán en el programa al momento de la compra.", "Los puntos no son dinero, no pueden venderse ni transferirse y no tienen valor de reembolso en efectivo. Para canjear una recompensa, identifícate y solicita el canje antes de pagar. La disponibilidad puede variar por sucursal, horario, inventario o campaña. Los puntos se descuentan al confirmar el canje.", "Las promociones especiales, como cumpleaños, puntos dobles o delivery participante, pueden tener requisitos, vigencia, zonas y límites propios. Esos detalles se comunicarán junto con cada promoción."] },
  { title: "4. Cambios, vencimiento y cierre", paragraphs: ["Las reglas de acumulación y las recompensas pueden cambiar. Si un cambio afecta de forma importante el uso de los puntos, comunicaremos la nueva regla por los canales disponibles. La vigencia de puntos o beneficios se indicará en la cuenta o en la promoción correspondiente; si no se muestra una fecha, consulta al equipo de La Bodega antes de canjearlos.", "Puedes dejar de participar y solicitar el cierre de tu cuenta. Al cerrarla, perderás acceso a los puntos y beneficios pendientes, salvo que las reglas aplicables dispongan otra cosa. También podemos finalizar el programa; informaremos los pasos y plazos de canje disponibles en ese caso."] },
  { title: "5. Privacidad", paragraphs: ["El tratamiento de tus datos se describe en nuestra Política de privacidad. Al crear y usar tu cuenta, reconoces que has podido consultarla. Las comunicaciones promocionales son opcionales y puedes cambiar tus preferencias o solicitar que cesen."] },
  { title: "6. Disponibilidad y responsabilidad", paragraphs: ["Haremos esfuerzos razonables para mantener el programa disponible y corregir errores. Algunas funciones pueden suspenderse temporalmente por mantenimiento, fallas técnicas, seguridad o causas fuera de nuestro control. La Bodega no garantiza disponibilidad ininterrumpida.", "Estas condiciones no limitan derechos que no puedan excluirse conforme a las normas aplicables. Para consultas sobre estas condiciones, escríbenos por WhatsApp o Instagram desde los enlaces de nuestra página, o acércate a cualquiera de nuestras sucursales."] },
  { title: "7. Actualizaciones", paragraphs: ["Podemos actualizar estas condiciones para reflejar cambios en Bodega Club o en las reglas aplicables. La versión vigente estará disponible en esta página con su fecha de actualización. El uso del programa después de la entrada en vigor de cambios constituye aceptación de las condiciones actualizadas, en la medida permitida por las normas aplicables."] },
];

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";
  const sections = isPrivacy ? privacy : terms;
  return (
    <div className="club-page min-h-dvh overflow-x-hidden bg-[#100c08] text-[#f7f2e7]">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#100c08]/90 backdrop-blur">
        <nav className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-5" aria-label="Navegación principal">
          <Link href="/bodega-club" className="flex items-center gap-3" aria-label="Volver a Bodega Club">
            <Image src="/logo-bodega.png" alt="" width={32} height={32} className="size-8 object-contain" />
            <span className="text-lg font-bold uppercase tracking-[0.06em]">La Bodega</span>
          </Link>
          <Link href="/bodega-club" className="flex items-center gap-2 text-sm text-[#d6c9ae] transition hover:text-white"><ArrowLeft className="size-4" aria-hidden="true" />Volver al club</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#efc77e]">{isPrivacy ? <ShieldCheck className="size-4" aria-hidden="true" /> : <Scale className="size-4" aria-hidden="true" />}Bodega Club · Información legal</p>
            <h1 className="max-w-[11ch] text-[clamp(3rem,8vw,6rem)] font-semibold uppercase leading-[0.88] tracking-[-0.03em]">{isPrivacy ? "Política de privacidad" : "Condiciones del servicio"}</h1>
            <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-[#d6c9ae]">{isPrivacy ? "Cómo cuidamos y usamos la información de tu membresía." : "Las reglas para participar en el programa de beneficios de La Bodega."}</p>
            <p className="mt-5 text-sm text-[#8e8267]">Última actualización: 9 de octubre de 2026</p>
            <div className="mt-9 border-t border-white/10 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8e8267]">También puedes consultar</p>
              <Link className="flex items-center justify-between border-b border-white/10 py-3 text-sm text-[#d6c9ae] hover:text-white" href={isPrivacy ? "/condiciones-del-servicio" : "/politica-de-privacidad"}>{isPrivacy ? "Condiciones del servicio" : "Política de privacidad"}<ArrowRight className="size-4" aria-hidden="true" /></Link>
            </div>
          </aside>
          <article className="divide-y divide-white/10 border-t border-white/10">
            {sections.map((section) => <section key={section.title} className="py-7 sm:py-9"><h2 className="mb-4 text-2xl font-semibold uppercase leading-none tracking-wide text-[#efc77e]">{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-3 max-w-[70ch] text-base leading-[1.8] text-[#d6c9ae] last:mb-0">{paragraph}</p>)}{section.items && <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-[#d6c9ae]">{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}
          </article>
        </div>
      </main>
      <footer className="border-t border-white/10 px-5 py-8 text-sm text-[#8e8267]"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4"><Link href="/bodega-club" className="hover:text-white">Bodega Club · La Bodega</Link><span>Puerto Ordaz, Venezuela · © 2026 {companyLine}</span></div></footer>
    </div>
  );
}
