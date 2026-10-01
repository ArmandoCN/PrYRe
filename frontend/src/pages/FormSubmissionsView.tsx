import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

function formatValue(val: any): string {
  if (val === null || val === undefined || val === '') {
    return '';
  }
  if (typeof val === 'string' && isoDateRegex.test(val)) {
    return format(new Date(val), 'dd/MM/yyyy');
  }
  if (typeof val === 'boolean') {
    return val ? 'Sí' : 'No';
  }
  return String(val);
}

export function FormSubmissionsView() {
  const { form_identifier } = useParams();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filtering
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  
  // Bulk Delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  const navigate = useNavigate();

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`/api/forms/${form_identifier}/submissions`);
      if (response.data.success) {
        setSubmissions(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [form_identifier]);

  // Dynamic Columns Extraction
  const columns = useMemo(() => {
    if (submissions.length === 0) return [];
    
    const internalKeys = ['id', 'updated_at', 'deleted_at'];
    
    let maxKeysObj = submissions[0];
    submissions.forEach(sub => {
      if (Object.keys(sub).length > Object.keys(maxKeysObj).length) {
        maxKeysObj = sub;
      }
    });

    const dataKeys = Object.keys(maxKeysObj).filter(k => !internalKeys.includes(k) && k !== 'created_at');
    
    const formatHeader = (key: string) => {
      return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return [
      { key: 'created_at', label: 'Fecha Registro' },
      ...dataKeys.map(key => ({ key, label: formatHeader(key) }))
    ];
  }, [submissions]);

  // Filter Data based on Global Search and Column Filters
  const filteredSubmissions = useMemo(() => {
    let result = submissions;
    
    if (globalSearch.trim()) {
      const lowerSearch = globalSearch.toLowerCase();
      result = result.filter(sub => {
        return Object.values(sub).some(val => 
          formatValue(val).toLowerCase().includes(lowerSearch)
        );
      });
    }

    if (showColumnFilters) {
      Object.entries(columnFilters).forEach(([key, filterValue]) => {
        if (filterValue.trim()) {
          const lowerFilter = filterValue.toLowerCase();
          result = result.filter(sub => {
            const val = formatValue(sub[key]);
            return val.toLowerCase().includes(lowerFilter);
          });
        }
      });
    }

    return result;
  }, [submissions, globalSearch, columnFilters, showColumnFilters]);

  // Bulk Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const deleteSelected = async () => {
    if (!window.confirm(`¿Estás seguro de borrar ${selectedIds.size} registros?`)) return;
    
    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => 
          axios.delete(`/api/forms/${form_identifier}/submissions/${id}`)
        )
      );
      
      setSelectedIds(new Set());
      await fetchSubmissions();
    } catch (err) {
      alert("Hubo un error eliminando algunos registros");
    } finally {
      setIsDeleting(false);
    }
  };

  // Exports
  const exportExcel = () => {
    const exportData = filteredSubmissions.map(sub => {
      const row: any = {};
      columns.forEach(col => {
        row[col.label] = formatValue(sub[col.key]);
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    
    XLSX.writeFile(workbook, `${form_identifier}_Datos.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text(`Reporte de Registros: ${form_identifier}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    
    const tableColumn = columns.map(c => c.label);
    const tableRows = filteredSubmissions.map(sub => {
      return columns.map(col => formatValue(sub[col.key]));
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [65, 105, 225] }
    });
    
    doc.save(`${form_identifier}_Reporte.pdf`);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando datos...</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground" onClick={() => navigate('/admin/dashboard')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver al Dashboard Central
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Datos: {form_identifier}</h1>
              <p className="text-muted-foreground mt-1">
                Visualización dinámica de registros y envíos
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.size > 0 && (
                <Button variant="destructive" onClick={deleteSelected} disabled={isDeleting}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  {isDeleting ? 'Borrando...' : `Borrar ${selectedIds.size}`}
                </Button>
              )}
              
              <Button variant="outline" onClick={exportPDF}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                PDF
              </Button>
              <Button onClick={exportExcel} className="bg-green-700 hover:bg-green-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25Gx" />
                </svg>
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Registros Recibidos</CardTitle>
            <CardDescription>
              Mostrando {filteredSubmissions.length} de {submissions.length} totales.
            </CardDescription>
          </div>
          <div className="w-full md:w-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowColumnFilters(!showColumnFilters)}
              className={showColumnFilters ? 'bg-muted' : ''}
              title="Alternar filtros por columna"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
              Filtros
            </Button>
            <Input 
              placeholder="Búsqueda global..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="bg-muted/50 w-full md:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive font-medium">{error}</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aún no hay envíos registrados para este formulario.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] align-top pt-4">
                      <Checkbox 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredSubmissions.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </TableHead>
                    {columns.map(col => (
                      <TableHead key={col.key} className="whitespace-nowrap align-top pt-4 px-2">
                        <div className="flex flex-col space-y-2">
                          <span className="font-semibold text-foreground/80">{col.label}</span>
                          {showColumnFilters && (
                            <Input
                              placeholder="Filtrar..."
                              className="h-8 text-xs font-normal"
                              value={columnFilters[col.key] || ''}
                              onChange={(e) => setColumnFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                            />
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">
                        No se encontraron resultados para tu búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <TableRow key={sub.id} className={selectedIds.has(sub.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.has(sub.id)}
                            onCheckedChange={() => toggleSelectOne(sub.id)}
                            aria-label={`Seleccionar fila`}
                          />
                        </TableCell>
                        {columns.map(col => {
                          const displayValue = formatValue(sub[col.key]);
                          
                          if (typeof sub[col.key] === 'boolean') {
                            return (
                              <TableCell key={col.key} className="whitespace-nowrap">
                                {sub[col.key] ? (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sí</span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">No</span>
                                )}
                              </TableCell>
                            );
                          }
                          
                          return (
                            <TableCell key={col.key} className="whitespace-nowrap">
                              {displayValue || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
