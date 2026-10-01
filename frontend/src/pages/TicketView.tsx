import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TicketView() {
  const [searchParams] = useSearchParams();
  const folio = searchParams.get('folio') || searchParams.get('code') || 'N/A';
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-10 flex flex-col items-center justify-center print:bg-white print:p-0">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="shadow-2xl border-2 border-primary/20 print:shadow-none print:border-black print:border">
          <CardHeader className="text-center border-b pb-6">
            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Sistema Central de Registros</h2>
            <CardTitle className="text-4xl mt-2 font-extrabold">Comprobante de Registro</CardTitle>
          </CardHeader>
          <CardContent className="p-10 flex flex-col items-center text-center space-y-8">
            <div className="space-y-2">
              <p className="text-xl text-muted-foreground">Tu folio oficial de validación es:</p>
              <p className="text-5xl font-mono font-black tracking-widest bg-muted/50 p-4 rounded-lg border">
                {folio}
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground max-w-md">
              <p>Por favor, conserva este comprobante. Puedes imprimirlo o guardar una captura de pantalla.</p>
              <p className="mt-2">Presenta este código el día del evento para tu acceso.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 print:hidden">
          <Button onClick={() => window.print()} variant="default" size="lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v3.396c0 .611.49 1.109 1.109 1.109h8.282c.61 0 1.109-.498 1.109-1.109V9.218Z" />
            </svg>
            Imprimir Comprobante
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
