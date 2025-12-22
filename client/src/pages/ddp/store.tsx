import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  Minus,
  CreditCard,
  CheckCircle,
  IndianRupee,
  Sun
} from "lucide-react";
import type { Product, Order } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const categoryLabels: Record<string, string> = {
  solar_package: "Solar Package",
  marketing_material: "Marketing Material",
  accessory: "Accessory",
};

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
}

// Generate capacity options from 3 kW to 100 kW
const capacityOptions = Array.from({ length: 98 }, (_, i) => i + 3);

// Calculate booking amount based on capacity
function getBookingAmount(capacityKw: number): number {
  if (capacityKw <= 3) {
    return 5000;
  }
  return 20000;
}

export default function DDPStore() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCapacity, setSelectedCapacity] = useState<string>("3");
  const [checkoutData, setCheckoutData] = useState<CheckoutFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders/create", data);
      return response;
    },
    onSuccess: async (data: any) => {
      const options = {
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: "DivyanshiSolar",
        description: "Order Payment",
        order_id: data.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await apiRequest("POST", "/api/orders/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            setCart([]);
            setShowCheckout(false);
            toast({
              title: "Payment Successful",
              description: "Your order has been placed successfully!",
            });
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: checkoutData.customerName,
          email: checkoutData.customerEmail,
          contact: checkoutData.customerPhone,
        },
        theme: {
          color: "#f59e0b",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} added to cart`,
    });
  };

  const addBookingToCart = () => {
    const capacityKw = parseInt(selectedCapacity);
    const amount = getBookingAmount(capacityKw);
    const bookingProduct: Product = {
      id: `booking-${capacityKw}kw`,
      name: `Booking Amount - ${capacityKw} kW Plant Installation`,
      description: `Advance booking amount for ${capacityKw} kW solar plant installation. This amount will be adjusted in the final bill.`,
      category: "solar_package",
      price: amount,
      bookingAmount: amount, // For booking items, booking amount equals price
      imageUrl: null,
      isActive: "active",
      stock: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Remove any existing booking from cart before adding new one
    setCart((prev) => {
      const filteredCart = prev.filter((item) => !item.product.id.startsWith("booking-"));
      return [...filteredCart, { product: bookingProduct, quantity: 1 }];
    });
    
    toast({
      title: "Booking Added",
      description: `${capacityKw} kW plant booking (${formatINR(amount)}) added to cart`,
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Calculate cart total - use booking amount only for solar booking items, full price for products
  const cartTotal = cart.reduce(
    (sum, item) => {
      // For booking items (solar plant), use the booking amount
      if (item.product.id.startsWith("booking-")) {
        return sum + item.product.price * item.quantity;
      }
      // For regular products, use the full price
      return sum + item.product.price * item.quantity;
    },
    0
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }
    setShowCheckout(true);
  };

  const handlePayment = () => {
    if (!checkoutData.customerName || !checkoutData.customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please enter customer name and phone number.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price, // Use price (which is booking amount for solar bookings)
      })),
      customerName: checkoutData.customerName,
      customerPhone: checkoutData.customerPhone,
      customerEmail: checkoutData.customerEmail,
      customerAddress: checkoutData.customerAddress,
    });
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Processing</Badge>;
      case "shipped":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Delivered</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (productsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Store</h1>
            <p className="text-muted-foreground">Purchase products and collect customer payments</p>
          </div>
        </div>
        <Button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          data-testid="button-checkout"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart ({cart.length}) - {formatINR(cartTotal)}
        </Button>
      </div>

      {/* Booking Amount Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" />
            Book Solar Plant Installation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="capacity-select">Select Plant Capacity</Label>
              <Select value={selectedCapacity} onValueChange={setSelectedCapacity}>
                <SelectTrigger id="capacity-select" className="w-full sm:w-48" data-testid="select-capacity">
                  <SelectValue placeholder="Select capacity" />
                </SelectTrigger>
                <SelectContent>
                  {capacityOptions.map((kw) => (
                    <SelectItem key={kw} value={kw.toString()}>
                      {kw} kW
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Booking amount: {parseInt(selectedCapacity) <= 3 ? "Rs 5,000" : "Rs 20,000"} (Up to 3 kW: Rs 5,000 | Above 3 kW: Rs 20,000)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-primary">{formatINR(getBookingAmount(parseInt(selectedCapacity)))}</p>
              </div>
              <Button onClick={addBookingToCart} data-testid="button-add-booking">
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Your Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatINR(item.product.bookingAmount ?? item.product.price)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      data-testid={`button-decrease-${item.product.id}`}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      data-testid={`button-increase-${item.product.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="font-medium w-24 text-right">
                    {formatINR((item.product.bookingAmount ?? item.product.price) * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">{formatINR(cartTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.filter((p) => !p.name.toLowerCase().includes("booking amount")).map((product) => (
          <Card key={product.id} data-testid={`card-product-${product.id}`}>
            {product.imageUrl ? (
              <div className="w-full h-40 overflow-hidden rounded-t-lg">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <CardHeader className="pt-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {categoryLabels[product.category] || product.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              )}
              <p className="text-2xl font-bold">{formatINR(product.price)}</p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => addToCart(product)}
                data-testid={`button-add-${product.id}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
        {(!products || products.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Products will appear here when added by admin
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {orders && orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatINR(order.totalAmount)}</TableCell>
                    <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Checkout
            </DialogTitle>
            <DialogDescription>
              Enter customer details to complete the order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={checkoutData.customerName}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, customerName: e.target.value })
                }
                placeholder="Enter customer name"
                data-testid="input-customer-name"
              />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={checkoutData.customerPhone}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, customerPhone: e.target.value })
                }
                placeholder="Enter phone number"
                data-testid="input-customer-phone"
              />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input
                value={checkoutData.customerEmail}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, customerEmail: e.target.value })
                }
                placeholder="Enter email"
                data-testid="input-customer-email"
              />
            </div>
            <div>
              <Label>Address (optional)</Label>
              <Input
                value={checkoutData.customerAddress}
                onChange={(e) =>
                  setCheckoutData({ ...checkoutData, customerAddress: e.target.value })
                }
                placeholder="Enter address"
                data-testid="input-customer-address"
              />
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold">{formatINR(cartTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={createOrderMutation.isPending}
              data-testid="button-pay"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {createOrderMutation.isPending ? "Processing..." : `Pay ${formatINR(cartTotal)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
