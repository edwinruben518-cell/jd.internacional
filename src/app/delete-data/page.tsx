export default function DeleteDataPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code

  return (
    <div className="min-h-screen bg-[#050314] text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-cyan-400">Eliminación de Datos</h1>

        {code ? (
          <>
            <p className="text-white/70 text-sm leading-relaxed">
              Tu solicitud de eliminación de datos fue recibida correctamente.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4">
              <p className="text-xs text-white/40 mb-1">Código de confirmación</p>
              <p className="text-cyan-400 font-mono font-bold text-lg">{code}</p>
            </div>
            <p className="text-white/40 text-xs">
              Tus datos serán eliminados en un plazo de 30 días. Guarda este código como comprobante.
            </p>
          </>
        ) : (
          <>
            <p className="text-white/70 text-sm leading-relaxed">
              Para solicitar la eliminación de tus datos personales de Jade AI,
              podés hacerlo directamente desde la configuración de tu cuenta de Facebook
              o enviando un correo a{' '}
              <span className="text-cyan-400">quisperuben518@gmail.com</span> con el
              asunto <strong>"Eliminar mis datos"</strong>.
            </p>
            <p className="text-white/40 text-xs">
              Procesamos todas las solicitudes en un plazo máximo de 30 días.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
