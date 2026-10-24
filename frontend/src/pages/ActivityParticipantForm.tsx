import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { activityParticipantSchema, type ActivityParticipantData } from '@/lib/validations/activityParticipant';
import { formatDateMX, formatDateTimeMX, isValidDateDDMMYY, parseDateToISO } from '@/lib/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DateInputDDMMYY } from '@/components/ui/date-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface CatalogActivity {
  id: string;
  activity_name: string;
  activity_date: string;
  total_capacity: number;
  reserved_capacity: number;
  real_capacity: number;
  registered_count: number;
  available_spots: number;
}

interface ActivityParticipantRecord {
  id: string;
  folio: string | null;
  activity_id: string;
  activity_name: string;
  participant_name: string;
  birthdate: string;
  gender: 'H' | 'M';
  needs_special_support: boolean;
  tutor_name: string | null;
  tutor_phone: string;
  secondary_phone: string | null;
  notes: string | null;
  created_at: string;
}

const LOCAL_STORAGE_RESERVATION_KEY = 'pryre_res_ActivityParticipant';

export function ActivityParticipantForm() {
  // Estados de configuración de formulario (FormConfig)
  const [configLoading, setConfigLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordProvided, setPasswordProvided] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmationMode, setConfirmationMode] = useState<'SIMPLE' | 'CODE' | 'TICKET'>('SIMPLE');

  // Estados de reserva y control global de cupos
  const [reservationToken, setReservationToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [hasLimit, setHasLimit] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [error, setError] = useState('');

  // Estados de éxito y folio
  const [success, setSuccess] = useState(false);
  const [folio, setFolio] = useState('');

  // Catálogo de actividades y refresco
  const [activities, setActivities] = useState<CatalogActivity[]>([]);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);

  // Panel de visualización de datos de la actividad seleccionada
  const [showParticipantsData, setShowParticipantsData] = useState(false);
  const [activityParticipants, setActivityParticipants] = useState<ActivityParticipantRecord[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsSearch, setParticipantsSearch] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingParticipants, setDeletingParticipants] = useState(false);

  // Panel inline de Nueva Actividad
  const [showNewActivityPanel, setShowNewActivityPanel] = useState(false);
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [newActName, setNewActName] = useState('');
  const [newActDate, setNewActDate] = useState('');
  const [newActTotal, setNewActTotal] = useState<number | string>(20);
  const [newActReserved, setNewActReserved] = useState<number | string>(0);
  const [newActError, setNewActError] = useState('');

  // Edición rápida por doble clic en Fecha o Cupo Real
  const [editingDate, setEditingDate] = useState(false);
  const [editDateValue, setEditDateValue] = useState('');
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [editRealCapValue, setEditRealCapValue] = useState<number | string>('');
  const [editReservedCapValue, setEditReservedCapValue] = useState<number | string>('');
  const [savingInlineEdit, setSavingInlineEdit] = useState(false);

  const form = useForm<ActivityParticipantData>({
    resolver: zodResolver(activityParticipantSchema),
    defaultValues: {
      activity_id: '',
      participant_name: '',
      birthdate: '',
      gender: undefined,
      needs_special_support: false,
      tutor_name: '',
      tutor_phone: '',
      secondary_phone: '',
      notes: '',
    },
  });

  const selectedActivityId = useWatch({ control: form.control, name: 'activity_id' });
  const selectedActivity = activities.find((a) => a.id === selectedActivityId) || null;

  // Bloquear controles si no hay actividad seleccionada o si no quedan lugares disponibles
  const isNoSpotsAvailable = selectedActivity !== null && selectedActivity.available_spots <= 0;
  const isControlsBlocked = !selectedActivity || isNoSpotsAvailable;

  const newActRealCapacity = Math.max(
    0,
    (Number(newActTotal) || 0) - (Number(newActReserved) || 0)
  );

  const fetchActivityParticipants = async (actId: string) => {
    if (!actId) {
      setActivityParticipants([]);
      return;
    }
    try {
      setLoadingParticipants(true);
      const res = await axios.get(`/api/activities/${actId}/participants`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setActivityParticipants(res.data.data);
      } else {
        setActivityParticipants([]);
      }
    } catch (err) {
      console.error('Error fetching activity participants:', err);
      setActivityParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleDeleteSelectedParticipants = async () => {
    if (!selectedActivity || selectedParticipantIds.length === 0) return;
    try {
      setDeletingParticipants(true);
      await axios.post(`/api/activities/${selectedActivity.id}/participants/delete`, {
        ids: selectedParticipantIds,
      });
      setSelectedParticipantIds([]);
      setConfirmDeleteOpen(false);
      await Promise.all([
        fetchActivitiesCatalog(selectedActivity.id),
        fetchActivityParticipants(selectedActivity.id),
      ]);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al borrar los participantes seleccionados.');
    } finally {
      setDeletingParticipants(false);
    }
  };

  useEffect(() => {
    initializeForm();
  }, []);

  useEffect(() => {
    setEditingDate(false);
    setEditingCapacity(false);
    setSelectedParticipantIds([]);
    setConfirmDeleteOpen(false);
    if (showParticipantsData && selectedActivityId) {
      fetchActivityParticipants(selectedActivityId);
    }
  }, [showParticipantsData, selectedActivityId]);

  const handleStartEditDate = () => {
    if (!selectedActivity) return;
    setEditDateValue(formatDateMX(selectedActivity.activity_date));
    setEditingDate(true);
  };

  const handleSaveInlineDate = async () => {
    if (!selectedActivity) return;
    if (!editDateValue || !isValidDateDDMMYY(editDateValue)) {
      alert('Ingresa una fecha válida en formato DD/MM/AA.');
      return;
    }
    try {
      setSavingInlineEdit(true);
      await axios.patch(`/api/activities/${selectedActivity.id}`, {
        activity_date: parseDateToISO(editDateValue),
      });
      await fetchActivitiesCatalog(selectedActivity.id);
      if (showParticipantsData) {
        await fetchActivityParticipants(selectedActivity.id);
      }
      setEditingDate(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al actualizar la fecha.');
    } finally {
      setSavingInlineEdit(false);
    }
  };

  const handleStartEditCapacity = () => {
    if (!selectedActivity) return;
    setEditRealCapValue(selectedActivity.real_capacity);
    setEditReservedCapValue(selectedActivity.reserved_capacity);
    setEditingCapacity(true);
  };

  const handleSaveInlineCapacity = async () => {
    if (!selectedActivity) return;
    const realVal = Number(editRealCapValue);
    const resVal = Number(editReservedCapValue);
    if (isNaN(realVal) || realVal < 0) {
      alert('El cupo real no puede ser negativo.');
      return;
    }
    if (isNaN(resVal) || resVal < 0) {
      alert('El cupo reservado no puede ser negativo.');
      return;
    }
    const newTotal = Math.max(1, realVal + resVal);
    try {
      setSavingInlineEdit(true);
      await axios.patch(`/api/activities/${selectedActivity.id}`, {
        total_capacity: newTotal,
        reserved_capacity: resVal,
        real_capacity: realVal,
      });
      await fetchActivitiesCatalog(selectedActivity.id);
      setEditingCapacity(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error al actualizar el cupo.');
    } finally {
      setSavingInlineEdit(false);
    }
  };

  const acquireReservation = async () => {
    try {
      // 1. Verificar si hay reserva vigente en localStorage
      const savedRes = localStorage.getItem(LOCAL_STORAGE_RESERVATION_KEY);
      if (savedRes) {
        try {
          const parsed = JSON.parse(savedRes);
          const token = parsed.token || parsed.reservation_token;
          const expStr = parsed.expiresAt || parsed.expires_at;
          if (token && expStr && new Date(expStr).getTime() > Date.now()) {
            setReservationToken(token);
            setExpiresAt(new Date(expStr));
            return token;
          } else {
            localStorage.removeItem(LOCAL_STORAGE_RESERVATION_KEY);
          }
        } catch {
          localStorage.removeItem(LOCAL_STORAGE_RESERVATION_KEY);
        }
      }

      // 2. Solicitar nueva reserva al backend
      const reserveRes = await axios.post('/api/forms/ActivityParticipant/reserve');
      if (reserveRes.data?.success && reserveRes.data?.data) {
        const resData = reserveRes.data.data;
        const token = resData.reservation_token;
        const exp = new Date(resData.expires_at);
        setReservationToken(token);
        setExpiresAt(exp);

        if (token) {
          localStorage.setItem(
            LOCAL_STORAGE_RESERVATION_KEY,
            JSON.stringify({
              token,
              expiresAt: exp.toISOString(),
            })
          );
        }
        return token;
      }
    } catch (err: any) {
      if (
        err.response?.data?.error?.code === 'LIMIT_REACHED' ||
        err.response?.data?.error?.message === 'LIMIT_REACHED'
      ) {
        setIsSoldOut(true);
      }
    }
    return null;
  };

  const fetchActivitiesCatalog = async (preferredActivityId?: string) => {
    try {
      const catalogRes = await axios.get('/api/activities/catalog');
      const list: CatalogActivity[] = catalogRes.data.data || [];
      setActivities(list);

      if (preferredActivityId) {
        form.setValue('activity_id', preferredActivityId, { shouldValidate: true });
      } else if (list.length > 0) {
        // Por defecto selecciona la última actividad capturada (list[0].id)
        const currentSelected = form.getValues('activity_id');
        if (!currentSelected || !list.some((a) => a.id === currentSelected)) {
          form.setValue('activity_id', list[0].id, { shouldValidate: true });
        }
      } else {
        // Si aún no existen actividades registradas, abrir el panel inline
        setShowNewActivityPanel(true);
      }
    } catch (err) {
      console.error('Error fetching activities catalog:', err);
    }
  };

  const initializeForm = async () => {
    try {
      setConfigLoading(true);
      const res = await axios.get('/api/forms/ActivityParticipant/config');
      if (!res.data?.success || !res.data?.data) {
        setError('Error al cargar la configuración del formulario.');
        setConfigLoading(false);
        return;
      }

      const cfg = res.data.data;
      setIsActive(Boolean(cfg.is_active));
      setRequiresPassword(Boolean(cfg.requires_password));
      setConfirmationMode(cfg.confirmation_mode || 'SIMPLE');
      const limit = cfg.max_submissions !== null && cfg.max_submissions !== undefined;
      setHasLimit(limit);

      if (!cfg.is_active) {
        setConfigLoading(false);
        return;
      }

      // Si requiere contraseña y aún no se ha provisto, esperar a que el usuario la ingrese
      if (cfg.requires_password && !passwordProvided) {
        setConfigLoading(false);
        return;
      }

      if (limit) {
        await acquireReservation();
      }

      await fetchActivitiesCatalog();
      setConfigLoading(false);
    } catch (err: any) {
      setError('Error al cargar la configuración del formulario.');
      setConfigLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) return;
    const pwd = passwordInput.trim();
    setPasswordProvided(pwd);

    if (hasLimit) {
      await acquireReservation();
    }
    await fetchActivitiesCatalog();
  };

  const handleRefreshCatalog = async () => {
    const currentId = form.getValues('activity_id');
    setRefreshingCatalog(true);
    try {
      await fetchActivitiesCatalog(currentId);
      if (showParticipantsData && currentId) {
        await fetchActivityParticipants(currentId);
      }
    } finally {
      setRefreshingCatalog(false);
    }
  };

  const handleCreateInlineActivity = async () => {
    setNewActError('');
    if (!newActName.trim() || newActName.trim().length < 2) {
      setNewActError('Ingresa el nombre de la actividad.');
      return;
    }
    if (!newActDate || !isValidDateDDMMYY(newActDate)) {
      setNewActError('Ingresa una fecha válida en formato DD/MM/AA.');
      return;
    }
    const total = Number(newActTotal);
    const reserved = Number(newActReserved);
    if (isNaN(total) || total < 1) {
      setNewActError('El cupo total debe ser al menos 1.');
      return;
    }
    if (isNaN(reserved) || reserved < 0) {
      setNewActError('El cupo reservado no puede ser negativo.');
      return;
    }
    if (reserved > total) {
      setNewActError('El cupo reservado no puede ser mayor al cupo total.');
      return;
    }

    try {
      setCreatingActivity(true);
      const response = await axios.post('/api/forms/ActivityCatalog/submissions', {
        data: {
          activity_name: newActName.trim(),
          activity_date: parseDateToISO(newActDate),
          total_capacity: total,
          reserved_capacity: reserved,
          real_capacity: total - reserved,
        },
      });

      const createdId = response.data?.data?.id;
      await fetchActivitiesCatalog(createdId);

      // Limpiar y cerrar mini-formulario
      setNewActName('');
      setNewActDate('');
      setNewActTotal(20);
      setNewActReserved(0);
      setShowNewActivityPanel(false);
    } catch (err: any) {
      setNewActError(err.response?.data?.error?.message || 'Error al guardar la nueva actividad.');
    } finally {
      setCreatingActivity(false);
    }
  };

  const onSubmit = async (data: ActivityParticipantData) => {
    if (!selectedActivity) {
      alert('Selecciona una actividad válida.');
      return;
    }
    if (selectedActivity.available_spots <= 0) {
      alert('Esta actividad ya no cuenta con lugares disponibles.');
      return;
    }

    try {
      const formattedActivityLabel = `${selectedActivity.activity_name} (${formatDateMX(selectedActivity.activity_date)})`;

      const transformedData = {
        activity_id: selectedActivity.id,
        activity_name: formattedActivityLabel,
        participant_name: data.participant_name.trim(),
        birthdate: parseDateToISO(data.birthdate),
        gender: data.gender,
        needs_special_support: Boolean(data.needs_special_support),
        tutor_name: data.tutor_name?.trim() ? data.tutor_name.trim() : null,
        tutor_phone: data.tutor_phone.trim(),
        secondary_phone: data.secondary_phone?.trim() ? data.secondary_phone.trim() : null,
        notes: data.notes?.trim() ? data.notes.trim() : null,
      };

      const payload = {
        data: transformedData,
        public_password: passwordProvided || undefined,
        reservation_token: reservationToken || undefined,
      };

      const response = await axios.post('/api/forms/ActivityParticipant/submissions', payload);

      localStorage.removeItem(LOCAL_STORAGE_RESERVATION_KEY);
      setFolio(response.data.data.folio);
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.error?.code === 'ACTIVITY_FULL') {
        alert('El último lugar disponible para esta actividad acaba de ser ocupado.');
        await fetchActivitiesCatalog(selectedActivity.id);
        return;
      }
      if (err.response?.data?.error?.message === 'RESERVATION_EXPIRED') {
        alert('Tu tiempo de reserva ha expirado. Por favor recarga la página para solicitar un nuevo lugar.');
        localStorage.removeItem(LOCAL_STORAGE_RESERVATION_KEY);
        window.location.reload();
        return;
      }
      alert('Error al enviar: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleResetForNewParticipant = async () => {
    const currentActId = form.getValues('activity_id');
    form.reset({
      activity_id: currentActId,
      participant_name: '',
      birthdate: '',
      gender: undefined,
      needs_special_support: false,
      tutor_name: '',
      tutor_phone: '',
      secondary_phone: '',
      notes: '',
    });
    setFolio('');
    setSuccess(false);

    // Si el formulario requiere reserva por max_submissions, obtener una nueva
    if (hasLimit) {
      await acquireReservation();
    }

    // Actualizar catálogo manteniendo la actividad seleccionada
    await fetchActivitiesCatalog(currentActId);
    if (showParticipantsData && currentActId) {
      await fetchActivityParticipants(currentActId);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center text-muted-foreground font-medium">
        Cargando formulario y catálogo de actividades...
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-red-500">
          <CardHeader>
            <CardTitle className="text-red-700">Formulario Cerrado</CardTitle>
            <CardDescription>
              El registro de participantes está cerrado actualmente. Por favor, comunícate con la administración si requieres asistencia.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/')}>
              Volver al Directorio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSoldOut) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-600">Cupo Global Agotado</CardTitle>
            <CardDescription>
              Lo sentimos, el cupo global establecido para este formulario se ha agotado o los lugares están temporalmente reservados. Intenta de nuevo más tarde por si se liberan espacios.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (requiresPassword && !passwordProvided) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Acceso Protegido</CardTitle>
            <CardDescription>Este formulario requiere una contraseña para ingresar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña de acceso..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePasswordSubmit();
              }}
            />
            <Button
              className="w-full"
              disabled={!passwordInput.trim()}
              onClick={handlePasswordSubmit}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/40 p-4 md:p-10 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg border-t-4 border-t-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto py-10 max-w-2xl px-4">
        <Card className="shadow-xl border-t-4 border-t-green-500 text-center p-6 bg-white">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-100 text-green-700 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">¡Participante Registrado!</CardTitle>
            <CardDescription className="text-base text-slate-700 mt-2">
              El participante ha sido inscrito exitosamente en{' '}
              <strong className="text-slate-900 font-semibold">{selectedActivity?.activity_name}</strong>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {folio && (
              <div className="p-4 bg-slate-50 rounded-lg inline-block border border-green-200">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Folio de Participante:
                </p>
                <p className="text-3xl font-mono font-extrabold text-foreground mt-1">{folio}</p>
              </div>
            )}

            {confirmationMode === 'CODE' && folio && (
              <div className="bg-slate-50 p-4 rounded-md border text-center my-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  Código de Confirmación Oficial:
                </p>
                <p className="text-2xl font-mono font-bold tracking-widest text-primary">{folio}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Conserva este código para futuras aclaraciones o asistencias.
                </p>
              </div>
            )}

            {confirmationMode === 'TICKET' && folio && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm space-y-3">
                <p className="font-medium">
                  Comprobante listo: Puedes ver e imprimir el boleto o comprobante oficial para el participante.
                </p>
                <div className="flex justify-center">
                  <a
                    href={`/forms/ActivityParticipant/ticket?folio=${folio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="default" className="gap-2 shadow font-semibold">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v3.396c0 .611.49 1.109 1.109 1.109h8.282c.61 0 1.109-.498 1.109-1.109V9.218Z"
                        />
                      </svg>
                      Ver / Imprimir Boleto
                    </Button>
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Button
                type="button"
                onClick={handleResetForNewParticipant}
                className="w-full sm:w-auto font-semibold px-6"
              >
                Registrar Otro Participante
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Volver al Directorio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 px-3">
      {/* Banner de Reserva de Cupo si hasLimit && expiresAt */}
      {hasLimit && expiresAt && (
        <div className="w-full max-w-3xl mx-auto mb-3 bg-blue-100 text-blue-900 p-3 rounded-lg border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-700 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <strong className="text-xs font-semibold text-blue-950">¡Tienes un lugar reservado! </strong>
              <span className="text-xs text-blue-800">Completa el registro antes de que expire.</span>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <span className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold mr-1">Vigente hasta:</span>
            <span className="text-sm font-mono font-bold text-blue-950">
              {new Date(expiresAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      <Card className="w-full max-w-3xl mx-auto shadow-md">
        <CardHeader className="p-4 sm:px-6 sm:py-4 border-b bg-slate-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-xl font-bold leading-tight">
              Registro de Participantes por Actividad
            </CardTitle>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold shrink-0 self-start sm:self-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-amber-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Uso interno de la biblioteca • No compartir con el público</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:px-6 sm:py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* SECCIÓN 1: SELECCIÓN Y ALTA DE ACTIVIDAD */}
              <div className="p-3 rounded-lg border bg-slate-50/80 space-y-2.5">
                <FormField
                  control={form.control}
                  name="activity_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <FormLabel className="text-sm font-bold text-foreground">
                          1. Selección de Actividad *
                        </FormLabel>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            variant={showParticipantsData ? 'secondary' : 'outline'}
                            size="sm"
                            className={`h-7 px-2.5 text-xs font-medium ${
                              showParticipantsData
                                ? 'bg-slate-200 text-slate-900 border border-slate-300'
                                : 'bg-white'
                            }`}
                            disabled={!selectedActivity}
                            onClick={() => setShowParticipantsData(!showParticipantsData)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-3.5 h-3.5 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            {showParticipantsData
                              ? 'Ocultar Datos'
                              : `Ver Datos (${selectedActivity?.registered_count ?? 0})`}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs font-medium bg-white"
                            onClick={handleRefreshCatalog}
                            disabled={refreshingCatalog}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`w-3 h-3 mr-1 ${refreshingCatalog ? 'animate-spin' : ''}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            {refreshingCatalog ? 'Actualizando...' : 'Actualizar Cupo'}
                          </Button>
                          <Button
                            type="button"
                            variant={showNewActivityPanel ? 'secondary' : 'default'}
                            size="sm"
                            className="h-7 px-2.5 text-xs font-medium"
                            onClick={() => setShowNewActivityPanel(!showNewActivityPanel)}
                          >
                            {showNewActivityPanel ? 'Cancelar Nueva Actividad' : '+ Nueva Actividad'}
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="" disabled>
                            {activities.length === 0
                              ? 'No hay actividades registradas (crea una abajo)...'
                              : 'Selecciona una actividad...'}
                          </option>
                          {activities.map((act) => (
                            <option key={act.id} value={act.id}>
                              {act.activity_name} — {formatDateMX(act.activity_date)} (Disponibles: {act.available_spots} de {act.real_capacity})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumen de cupo compacto con 4 KPI Cards y Barra de Progreso */}
                {selectedActivity && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      {/* Card 1: Fecha (Doble clic para editar en formato DD/MM/AA) */}
                      <div
                        className={`py-1.5 px-2 rounded bg-white border transition-colors ${
                          editingDate
                            ? 'border-primary ring-1 ring-primary'
                            : 'cursor-pointer hover:border-slate-400 select-none'
                        }`}
                        title={editingDate ? '' : 'Doble clic para editar la fecha (DD/MM/AA)'}
                        onDoubleClick={() => {
                          if (!editingDate) handleStartEditDate();
                        }}
                      >
                        <span className="block text-[11px] text-muted-foreground">
                          Fecha <span className="text-[9px] opacity-60">(2x clic)</span>
                        </span>
                        {editingDate ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <DateInputDDMMYY
                              autoFocus
                              className="h-6 text-xs px-1.5 pr-6"
                              value={editDateValue}
                              onChange={(val) => setEditDateValue(val)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveInlineDate();
                                } else if (e.key === 'Escape') {
                                  setEditingDate(false);
                                }
                              }}
                            />
                            <button
                              type="button"
                              disabled={savingInlineEdit}
                              onClick={handleSaveInlineDate}
                              title="Guardar fecha"
                              className="h-6 px-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shrink-0"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              disabled={savingInlineEdit}
                              onClick={() => setEditingDate(false)}
                              title="Cancelar"
                              className="h-6 px-1 rounded bg-slate-200 text-slate-700 text-xs hover:bg-slate-300 shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-xs text-foreground">
                            {formatDateMX(selectedActivity.activity_date)}
                          </span>
                        )}
                      </div>

                      {/* Card 2: Cupo Real (Doble clic para editar) */}
                      <div
                        className={`py-1.5 px-2 rounded bg-white border transition-colors ${
                          editingCapacity
                            ? 'border-primary ring-1 ring-primary'
                            : 'cursor-pointer hover:border-slate-400 select-none'
                        }`}
                        title={editingCapacity ? '' : 'Doble clic para editar el cupo real'}
                        onDoubleClick={() => {
                          if (!editingCapacity) handleStartEditCapacity();
                        }}
                      >
                        <span className="block text-[11px] text-muted-foreground">
                          Cupo Real <span className="text-[9px] opacity-60">(2x clic)</span>
                        </span>
                        {editingCapacity ? (
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <Input
                              autoFocus
                              type="number"
                              inputMode="numeric"
                              min={0}
                              className="h-6 w-14 text-xs px-1.5 text-center font-bold"
                              value={editRealCapValue}
                              onChange={(e) =>
                                setEditRealCapValue(e.target.value === '' ? '' : Number(e.target.value))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveInlineCapacity();
                                } else if (e.key === 'Escape') {
                                  setEditingCapacity(false);
                                }
                              }}
                            />
                            <button
                              type="button"
                              disabled={savingInlineEdit}
                              onClick={handleSaveInlineCapacity}
                              title="Guardar cupo real"
                              className="h-6 px-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shrink-0"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              disabled={savingInlineEdit}
                              onClick={() => setEditingCapacity(false)}
                              title="Cancelar"
                              className="h-6 px-1 rounded bg-slate-200 text-slate-700 text-xs hover:bg-slate-300 shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-xs text-foreground">
                            {selectedActivity.real_capacity}{' '}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              (T:{selectedActivity.total_capacity} / R:{selectedActivity.reserved_capacity})
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="py-1.5 px-2 rounded bg-white border">
                        <span className="block text-[11px] text-muted-foreground">Inscritos</span>
                        <span className="font-semibold text-xs text-foreground">
                          {selectedActivity.registered_count}
                        </span>
                      </div>
                      <div
                        className={`py-1.5 px-2 rounded border ${
                          selectedActivity.available_spots > 3
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : selectedActivity.available_spots >= 1
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-red-50 border-red-300 text-red-800'
                        }`}
                      >
                        <span className="block text-[11px] font-medium">Disponibles</span>
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-extrabold text-xs">{selectedActivity.available_spots}</span>
                          <span className="text-[10px] font-semibold uppercase px-1 rounded bg-white/80">
                            {selectedActivity.available_spots > 3
                              ? 'OK'
                              : selectedActivity.available_spots >= 1
                              ? 'Últimos'
                              : 'Agotado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Capacity Progress Bar */}
                    {(() => {
                      const realCap = Math.max(1, selectedActivity.real_capacity);
                      const pct = Math.min(100, Math.round((selectedActivity.registered_count / realCap) * 100));
                      const barColor =
                        selectedActivity.available_spots <= 0
                          ? 'bg-red-500'
                          : selectedActivity.available_spots <= 3
                          ? 'bg-amber-500'
                          : 'bg-emerald-500';

                      return (
                        <div className="px-2.5 py-1.5 rounded bg-white border flex items-center gap-3">
                          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                            Ocupación: {pct}%
                          </span>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Panel de Datos de Participantes de la Actividad Seleccionada */}
                {showParticipantsData && selectedActivity && (
                  <div className="p-3 rounded-lg bg-white border border-slate-300 shadow-xs space-y-2.5 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">
                          Participantes inscritos en: <span className="text-primary">{selectedActivity.activity_name}</span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Fecha de actividad: {formatDateMX(selectedActivity.activity_date)} • Total registrados: {activityParticipants.length}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          className="h-7 text-xs w-full sm:w-48"
                          placeholder="Buscar participante o folio..."
                          value={participantsSearch}
                          onChange={(e) => setParticipantsSearch(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={activityParticipants.length === 0}
                          onClick={() => {
                            if (!selectedActivity) return;
                            const filtered = activityParticipants.filter((p) => {
                              if (!participantsSearch.trim()) return true;
                              const q = participantsSearch.toLowerCase();
                              return (
                                (p.folio || '').toLowerCase().includes(q) ||
                                (p.participant_name || '').toLowerCase().includes(q) ||
                                (p.tutor_name || '').toLowerCase().includes(q) ||
                                (p.tutor_phone || '').toLowerCase().includes(q)
                              );
                            });
                            const rows = filtered.map((p) => ({
                              Folio: p.folio || '-',
                              Actividad: selectedActivity.activity_name,
                              'Fecha Actividad': formatDateMX(selectedActivity.activity_date),
                              Participante: p.participant_name,
                              'Fecha Nac.': formatDateMX(p.birthdate),
                              Género: p.gender === 'H' ? 'Hombre' : 'Mujer',
                              'Requiere Apoyo': p.needs_special_support ? 'Sí' : 'No',
                              'Nombre Tutor': p.tutor_name || 'N/A',
                              'Teléfono Tutor': p.tutor_phone,
                              'Otro Número': p.secondary_phone || '-',
                              Notas: p.notes || '',
                              'Fecha Registro': p.created_at ? formatDateTimeMX(p.created_at) : '',
                            }));
                            const worksheet = XLSX.utils.json_to_sheet(rows);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');
                            const safeName = selectedActivity.activity_name
                              .replace(/[^a-zA-Z0-9_-]+/g, '_')
                              .replace(/^_|_$/g, '');
                            const dateStr = formatDateMX(selectedActivity.activity_date).replace(/\//g, '-');
                            XLSX.writeFile(workbook, `Participantes_${safeName}_${dateStr}.xlsx`);
                          }}
                          className="h-7 px-2.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
                          title="Descargar lista en Excel (.xlsx)"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-3.5 h-3.5 mr-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                          </svg>
                          Excel
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => setShowParticipantsData(false)}
                          title="Cerrar tabla de datos"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>

                    {loadingParticipants ? (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        Cargando datos de la actividad seleccionada...
                      </div>
                    ) : activityParticipants.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground bg-slate-50 rounded border border-dashed">
                        Aún no hay participantes registrados en esta actividad.
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const filteredParticipants = activityParticipants.filter((p) => {
                            if (!participantsSearch.trim()) return true;
                            const q = participantsSearch.toLowerCase();
                            return (
                              (p.folio || '').toLowerCase().includes(q) ||
                              (p.participant_name || '').toLowerCase().includes(q) ||
                              (p.tutor_name || '').toLowerCase().includes(q) ||
                              (p.tutor_phone || '').toLowerCase().includes(q)
                            );
                          });
                          const allVisibleSelected =
                            filteredParticipants.length > 0 &&
                            filteredParticipants.every((p) => selectedParticipantIds.includes(p.id));

                          return (
                            <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-md">
                              <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b z-10">
                                  <tr>
                                    <th className="py-1.5 px-2 w-8 text-center">
                                      <input
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer align-middle"
                                        checked={allVisibleSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            const merged = Array.from(
                                              new Set([
                                                ...selectedParticipantIds,
                                                ...filteredParticipants.map((p) => p.id),
                                              ])
                                            );
                                            setSelectedParticipantIds(merged);
                                          } else {
                                            const visibleSet = new Set(filteredParticipants.map((p) => p.id));
                                            setSelectedParticipantIds(
                                              selectedParticipantIds.filter((id) => !visibleSet.has(id))
                                            );
                                          }
                                          setConfirmDeleteOpen(false);
                                        }}
                                        title="Seleccionar todos"
                                      />
                                    </th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap">Folio</th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap">Participante</th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap">Fecha Nac.</th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap text-center">Gén.</th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap text-center">Apoyo</th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap">Tutor</th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap">Tel. Tutor</th>
                                    <th className="py-1.5 px-2 font-semibold whitespace-nowrap">Otro Tel.</th>
                                    <th className="py-1.5 px-2 font-semibold">Notas</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {filteredParticipants.map((p) => {
                                    const isSelected = selectedParticipantIds.includes(p.id);
                                    return (
                                      <tr
                                        key={p.id}
                                        className={
                                          isSelected
                                            ? 'bg-red-50/70 hover:bg-red-50 transition-colors'
                                            : 'hover:bg-slate-50 transition-colors'
                                        }
                                      >
                                        <td className="py-1.5 px-2 text-center">
                                          <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer align-middle"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedParticipantIds((prev) => [...prev, p.id]);
                                              } else {
                                                setSelectedParticipantIds((prev) =>
                                                  prev.filter((id) => id !== p.id)
                                                );
                                              }
                                              setConfirmDeleteOpen(false);
                                            }}
                                          />
                                        </td>
                                        <td className="py-1.5 px-2 font-mono font-semibold text-[11px] whitespace-nowrap">
                                          {p.folio || '-'}
                                        </td>
                                        <td className="py-1.5 px-2 font-medium text-slate-900 whitespace-nowrap">
                                          {p.participant_name}
                                        </td>
                                        <td className="py-1.5 px-2 whitespace-nowrap text-slate-600">
                                          {formatDateMX(p.birthdate)}
                                        </td>
                                        <td className="py-1.5 px-2 text-center font-semibold">
                                          {p.gender}
                                        </td>
                                        <td className="py-1.5 px-2 text-center">
                                          {p.needs_special_support ? (
                                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                                              Sí
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">No</span>
                                          )}
                                        </td>
                                        <td className="py-1.5 px-2 whitespace-nowrap text-slate-700">
                                          {p.tutor_name || <span className="text-slate-400 italic">N/A</span>}
                                        </td>
                                        <td className="py-1.5 px-2 font-mono text-[11px] whitespace-nowrap">
                                          {p.tutor_phone}
                                        </td>
                                        <td className="py-1.5 px-2 font-mono text-[11px] whitespace-nowrap">
                                          {p.secondary_phone || <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="py-1.5 px-2 text-slate-600 max-w-[180px] truncate" title={p.notes || ''}>
                                          {p.notes || <span className="text-slate-400">-</span>}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}

                        {selectedParticipantIds.length > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            {!confirmDeleteOpen ? (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-700">
                                  {selectedParticipantIds.length}{' '}
                                  {selectedParticipantIds.length === 1
                                    ? 'registro seleccionado'
                                    : 'registros seleccionados'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs text-slate-600"
                                    onClick={() => setSelectedParticipantIds([])}
                                  >
                                    Cancelar selección
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 px-3 text-xs font-semibold"
                                    onClick={() => setConfirmDeleteOpen(true)}
                                  >
                                    Borrar ({selectedParticipantIds.length})
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-md bg-red-50 border border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="text-xs text-red-900">
                                  <strong className="font-bold">
                                    ¿Seguro que deseas borrar {selectedParticipantIds.length}{' '}
                                    {selectedParticipantIds.length === 1 ? 'registro' : 'registros'}?
                                  </strong>{' '}
                                  <span className="text-red-700">
                                    Esta acción liberará {selectedParticipantIds.length}{' '}
                                    {selectedParticipantIds.length === 1 ? 'lugar' : 'lugares'} en la actividad.
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs bg-white"
                                    disabled={deletingParticipants}
                                    onClick={() => setConfirmDeleteOpen(false)}
                                  >
                                    No, cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 px-3 text-xs font-bold"
                                    disabled={deletingParticipants}
                                    onClick={handleDeleteSelectedParticipants}
                                  >
                                    {deletingParticipants ? 'Borrando...' : 'Sí, confirmar borrado'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Panel Inline de Creación de Nueva Actividad */}
                {showNewActivityPanel && (
                  <div className="p-3 rounded-lg bg-white border-2 border-blue-200 shadow-sm space-y-3 mt-2">
                    <div className="border-b pb-1.5 flex justify-between items-center">
                      <h4 className="font-bold text-xs text-blue-900">Alta In-Situ de Actividad</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewActivityPanel(false)}
                      >
                        ✕
                      </Button>
                    </div>

                    {newActError && (
                      <div className="text-xs font-medium text-destructive bg-red-50 p-2 rounded border border-red-200">
                        {newActError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold block mb-1">Nombre de la Actividad *</label>
                        <Input
                          className="h-8 text-xs"
                          placeholder="Ej. Taller de Lectura"
                          value={newActName}
                          onChange={(e) => setNewActName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1">
                          Fecha en que se realiza (DD/MM/AA) *
                        </label>
                        <DateInputDDMMYY
                          className="h-8 text-xs"
                          value={newActDate}
                          onChange={(val) => setNewActDate(val)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                      <div>
                        <label className="text-xs font-semibold block mb-1">Cupo Total *</label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="h-8 text-xs"
                          min={1}
                          value={newActTotal}
                          onChange={(e) => setNewActTotal(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1">Cupo Reservado *</label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="h-8 text-xs"
                          min={0}
                          value={newActReserved}
                          onChange={(e) => setNewActReserved(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                      <div className="py-1 px-2 rounded border bg-blue-50/60 border-blue-200 text-center">
                        <span className="block text-[10px] font-semibold text-blue-800 uppercase">
                          Cupo Real
                        </span>
                        <span className="font-extrabold text-xs text-blue-900">
                          {newActRealCapacity} lugares
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowNewActivityPanel(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={creatingActivity}
                        onClick={handleCreateInlineActivity}
                        className="h-7 text-xs font-semibold"
                      >
                        {creatingActivity ? 'Guardando...' : 'Guardar y Seleccionar'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2 & 3 Y BOTÓN DENTRO DE FIELDSET DISABLED SI ESTÁ BLOQUEADO */}
              <fieldset
                disabled={isControlsBlocked}
                className={isControlsBlocked ? 'space-y-4 opacity-60 transition-opacity' : 'space-y-4 transition-opacity'}
              >
                {/* SECCIÓN 2: DATOS DEL PARTICIPANTE */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground border-b pb-1">
                    2. Datos del Participante
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                    <FormField
                      control={form.control}
                      name="participant_name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-1">
                          <FormLabel className="flex items-center h-5 text-xs font-semibold leading-none">
                            Nombre Completo *
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-sm"
                              placeholder="Nombre y apellidos"
                              disabled={isControlsBlocked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birthdate"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="flex items-center h-5 text-xs font-semibold leading-none">
                            Fecha de Nac. *
                          </FormLabel>
                          <FormControl>
                            <DateInputDDMMYY
                              className="h-9 text-sm"
                              disabled={isControlsBlocked}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="flex items-center h-5 text-xs font-semibold leading-none">
                            Género *
                          </FormLabel>
                          <FormControl>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={isControlsBlocked}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <option value="" disabled>
                                Selecciona...
                              </option>
                              <option value="H">Hombre</option>
                              <option value="M">Mujer</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="needs_special_support"
                    render={({ field }) => (
                      <FormItem>
                        <div
                          className={`flex flex-row items-center space-x-2.5 space-y-0 rounded-md border px-3 py-2 transition-colors ${
                            field.value
                              ? 'border-blue-400 bg-blue-50/50 ring-1 ring-blue-400'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <FormControl>
                            <Checkbox
                              disabled={isControlsBlocked}
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                            />
                          </FormControl>
                          <FormLabel className="font-semibold text-xs cursor-pointer leading-none">
                            Requiere apoyo con capacidad diferente o condición
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* SECCIÓN 3: DATOS DE CONTACTO / TUTOR Y NOTAS */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground border-b pb-1">
                    3. Datos de Contacto / Tutor y Notas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    <FormField
                      control={form.control}
                      name="tutor_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="flex items-center justify-between h-5 text-xs font-semibold leading-none whitespace-nowrap">
                            <span>Nombre Tutor</span>
                            <span className="text-[11px] text-muted-foreground font-normal">
                              (Opcional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-sm"
                              placeholder="Padre o tutor (si aplica)"
                              disabled={isControlsBlocked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tutor_phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="flex items-center h-5 text-xs font-semibold leading-none whitespace-nowrap">
                            Teléfono Tutor *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="numeric"
                              className="h-9 text-sm"
                              placeholder="10 dígitos"
                              maxLength={20}
                              disabled={isControlsBlocked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondary_phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="flex items-center justify-between h-5 text-xs font-semibold leading-none whitespace-nowrap">
                            <span>Otro Número</span>
                            <span className="text-[11px] text-muted-foreground font-normal">(Opcional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="numeric"
                              className="h-9 text-sm"
                              placeholder="Teléfono adicional"
                              maxLength={20}
                              disabled={isControlsBlocked}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <div className="flex justify-between items-center h-5">
                          <FormLabel className="text-xs font-semibold leading-none">
                            Notas y Observaciones <span className="text-[11px] text-muted-foreground font-normal">(Opcional)</span>
                          </FormLabel>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {(field.value || '').length} caracteres
                          </span>
                        </div>
                        <FormControl>
                          <textarea
                            rows={2}
                            disabled={isControlsBlocked}
                            placeholder="Observaciones médicas, alergias o notas..."
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* BOTÓN DE ENVÍO */}
                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-semibold shadow-sm"
                  disabled={isControlsBlocked || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? 'Guardando registro...'
                    : isNoSpotsAvailable
                    ? 'Cupo Agotado en esta Actividad'
                    : 'Registrar Participante'}
                </Button>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
