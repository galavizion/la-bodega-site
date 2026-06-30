import React, { useState, useEffect, useCallback } from 'react';
import { useClient } from 'sanity';
import { Box, Card, Stack, Text, Checkbox, Button, Select, Flex, Spinner, useToast, Grid } from '@sanity/ui';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  customerName: string;
}

const STATUS_OPTIONS = [
  { title: "⏳ Pendiente", value: "pending" },
  { title: "🏦 Esperando Pago (Transferencia)", value: "awaiting_payment" },
  { title: "✅ Confirmado", value: "confirmed" },
  { title: "📦 En preparación", value: "processing" },
  { title: "🚚 Enviado", value: "shipped" },
  { title: "🏠 Entregado", value: "delivered" },
  { title: "❌ Cancelado", value: "cancelled" },
];

export function OrderManagerPanel() {
  const client = useClient({ apiVersion: '2025-01-01' });
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const sanityToast = useToast();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    client.fetch<Order[]>(`*[_type == "order" && status != "deleted"] | order(createdAt desc) [0...200] { _id, orderNumber, status, total, "customerName": customer.name }`)
      .then(data => setOrders(data))
      .catch(err => {
        console.error('Failed to fetch orders', err);
        sanityToast.push({ status: 'error', title: 'Error al cargar pedidos.' });
      })
      .finally(() => setLoading(false));
  }, [client, sanityToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(orderId);
      else newSet.delete(orderId);
      return newSet;
    });
  };

  const handleAction = async (action: 'status' | 'delete') => {
    if (selectedOrders.size === 0) {
      sanityToast.push({ status: 'warning', title: 'Por favor, selecciona al menos un pedido.' });
      return;
    }
    if (action === 'status' && !targetStatus) {
      sanityToast.push({ status: 'warning', title: 'Por favor, selecciona un estado de destino.' });
      return;
    }

    const actionStatus = action === 'delete' ? 'deleted' : targetStatus;

    if (action === 'delete' && !window.confirm(`¿Estás seguro de que quieres mover ${selectedOrders.size} pedido(s) a la papelera?`)) {
      return;
    }

    setIsProcessing(true);
    const ids = Array.from(selectedOrders);

    try {
      const transaction = client.transaction();
      ids.forEach(id => {
        transaction.patch(id, { set: { status: actionStatus } });
      });
      await transaction.commit();

      sanityToast.push({ status: 'success', title: `${ids.length} pedido(s) actualizado(s).` });
      fetchOrders();
      setSelectedOrders(new Set());
    } catch (err) {
      console.error(err);
      sanityToast.push({ status: 'error', title: 'Ocurrió un error al procesar la solicitud.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Card padding={4} shadow={1} radius={3}>
          <Stack space={4}>
            <Text size={3} weight="bold">Gestión de Pedidos</Text>
            <Text size={1} muted>Selecciona pedidos para cambiar su estado o moverlos a la papelera.</Text>
            <Grid columns={[1, 2, 3, 4]} gap={3}>
              <Select
                fontSize={2}
                value={targetStatus}
                onChange={e => setTargetStatus(e.currentTarget.value)}
              >
                <option value="">-- Seleccionar nuevo estado --</option>
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.title}</option>)}
              </Select>
              <Button
                text="Aplicar Estado"
                tone="primary"
                onClick={() => handleAction('status')}
                disabled={isProcessing || selectedOrders.size === 0 || !targetStatus}
                loading={isProcessing}
              />
              <Button
                text="Mover a Papelera"
                tone="critical"
                onClick={() => handleAction('delete')}
                disabled={isProcessing || selectedOrders.size === 0}
                loading={isProcessing}
              />
            </Grid>
          </Stack>
        </Card>

        {loading ? (
          <Flex paddingY={5} justify="center" align="center" direction="column" gap={3}>
            <Spinner />
            <Text muted>Cargando pedidos...</Text>
          </Flex>
        ) : (
          <Card padding={2} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Stack as="ul" space={2} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {orders.map(order => (
                <Card as="li" key={order._id} padding={3} border radius={2}>
                  <Flex align="center" gap={4}>
                    <Checkbox style={{ transform: 'scale(1.2)'}} checked={selectedOrders.has(order._id)} onChange={e => handleSelectOrder(order._id, e.currentTarget.checked)} />
                    <Stack space={2} style={{ flex: 1 }}>
                      <Text weight="bold">#{order.orderNumber}</Text>
                      <Text size={1} muted>{order.customerName ?? 'Cliente no especificado'}</Text>
                    </Stack>
                    <Text size={1} weight="bold">${(order.total ?? 0).toLocaleString('es-MX')}</Text>
                    <Text size={1}>{STATUS_OPTIONS.find(s => s.value === order.status)?.title ?? order.status}</Text>
                  </Flex>
                </Card>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  );
}