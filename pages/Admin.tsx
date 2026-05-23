import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Product, Order, ChatSession, Category, ChatMessage } from "../types";
import { sheetApi } from "../services/api";
import Logo from "../components/Logo";

import { normalizeColors, safeParseJSON } from "../utils/colorUtils";

type AdminView =
  | "dashboard"
  | "inventory"
  | "categories"
  | "orders"
  | "chats"
  | "calendar";

const parseBoolean = (val: any): boolean => {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    return (
      lower === "true" ||
      lower === "on" ||
      lower === "1" ||
      lower === "yes" ||
      lower === "featured"
    );
  }
  return false;
};

const Admin: React.FC<{ onRefreshProducts?: () => void }> = ({
  onRefreshProducts,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ id: "", pass: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [filterDate, setFilterDate] = useState<string>("");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [replyText, setReplyText] = useState("");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mainImageBase64, setMainImageBase64] = useState<string>("");
  const [isMainImageOutOfStock, setIsMainImageOutOfStock] = useState<boolean>(false);
  const [galleryInputs, setGalleryInputs] = useState<{id: string, value: string, isOutOfStock?: boolean}[]>([]);
  const [colorInputs, setColorInputs] = useState<{id: string, value: string, isOutOfStock?: boolean}[]>([]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const mainFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadAllCloudData();
      const interval = setInterval(loadAllCloudData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        if (selectedOrder) {
          e.preventDefault();
          window.print();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOrder]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const user = await sheetApi.authenticate(loginForm.id, loginForm.pass);
      if (user) {
        setIsLoggedIn(true);
      } else {
        // Try a metadata request to check if script is alive
        const scriptStatus = await sheetApi.fetchCategories();
        if (scriptStatus === null) {
          alert(
            "CONNECTION FAILED: Could not reach your Google Script.\n\n1. Verify the URL is correct\n2. Ensure it's deployed as 'Anyone'\n3. Check your internet connection",
          );
        } else {
          alert(
            "ACCESS DENIED: The ID or Password did not match any user in your 'Users' sheet.",
          );
        }
      }
    } catch (e) {
      alert(
        "UNEXPECTED ERROR: " +
          (e instanceof Error ? e.message : "Network failure"),
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadAllCloudData = async () => {
    setIsLoading(true);
    try {
      const cloudCats = await sheetApi.fetchCategories();
      if (cloudCats && Array.isArray(cloudCats)) {
        setCategories(
          cloudCats.map((c) =>
            typeof c === "string" ? { id: c, name: c } : c,
          ),
        );
      } else if (cloudCats?.error) {
        console.error("Categories fetch error:", cloudCats.error);
      }

      const cloudProducts = await sheetApi.fetchProducts();
      if (cloudProducts && Array.isArray(cloudProducts)) {
        setProducts(
          cloudProducts.map((p: any) => ({
            ...p,
            images: safeParseJSON(p.images),
            colors: normalizeColors(p.colors),
            outOfStockColors: safeParseJSON(p.outOfStockColors),
            outOfStockImages: safeParseJSON(p.outOfStockImages),
            isFeatured: parseBoolean(p.isFeatured),
            isComingSoon: parseBoolean(p.isComingSoon),
          })),
        );
      } else if (cloudProducts?.error) {
        console.error("Products fetch error:", cloudProducts.error);
      }

      const cloudOrders = await sheetApi.fetchOrders();
      if (cloudOrders && Array.isArray(cloudOrders)) {
        setOrders(
          cloudOrders
            .map((o) => ({
              ...o,
              customer:
                typeof o.customer === "string"
                  ? JSON.parse(o.customer)
                  : o.customer,
              items:
                typeof o.items === "string" ? JSON.parse(o.items) : o.items,
            }))
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            ),
        );
      } else if (cloudOrders?.error) {
        console.error("Orders fetch error:", cloudOrders.error);
      }

      const cloudChats = await sheetApi.fetchChats();
      if (cloudChats && Array.isArray(cloudChats)) {
        setChats(
          cloudChats
            .map((c) => ({
              ...c,
              messages:
                typeof c.messages === "string"
                  ? JSON.parse(c.messages)
                  : c.messages,
            }))
            .sort(
              (a, b) =>
                new Date(b.lastMessageAt).getTime() -
                new Date(a.lastMessageAt).getTime(),
            ),
        );
      } else if (cloudChats?.error) {
        console.error("Chats fetch error:", cloudChats.error);
      }
    } catch (err) {
      console.error("Sync loop error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintManifest = (order: Order) => {
    import("react-dom").then(({ flushSync }) => {
      flushSync(() => {
        setSelectedOrder(order);
      });
      setTimeout(() => {
        window.print();
      }, 50);
    }).catch(() => {
        setSelectedOrder(order);
        setTimeout(() => window.print(), 800);
    });
  };

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleMainFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 35000) {
        alert(
          "WARNING: This image is over 35KB. Large images often fail to save in Google Sheets due to character limits. Try using an image URL or a compressed photo (< 30KB).",
        );
      }
      const base64 = await handleFileToBase64(file);
      setMainImageBase64(base64);
    }
  };

  const handleGalleryFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 35000) {
        alert(
          "WARNING: Sub-image is too large (> 35KB). It might fail to sync with Google Sheets.",
        );
      }
      const base64 = await handleFileToBase64(file);
      const next = [...galleryInputs];
      next[idx] = { ...next[idx], value: base64 };
      setGalleryInputs(next);
    }
  };

  const handleOpenProductModal = (product: Product | null) => {
    setEditingProduct(product);
    setMainImageBase64(product?.image || "");
    setIsMainImageOutOfStock(product?.outOfStockImages?.some(img => img.trim() === (product?.image || "").trim()) || false);
    setGalleryInputs((product?.images || []).map(val => ({
      id: Math.random().toString(),
      value: val,
      isOutOfStock: product?.outOfStockImages?.some(img => img.trim() === val.trim()) || false
    })));
    setColorInputs((product?.colors || []).map(val => ({
      id: Math.random().toString(),
      value: val,
      isOutOfStock: product?.outOfStockColors?.some(col => col.trim().toLowerCase() === val.trim().toLowerCase()) || false
    })));
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    const formData = new FormData(e.currentTarget);

    const mainImgUrl = mainImageBase64 || (formData.get("image_link") as string);
    const productData: Product = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      name: formData.get("name") as string,
      price: isNaN(Number(formData.get("price")))
        ? (formData.get("price") as string)
        : Number(formData.get("price")),
      category: formData.get("category") as string,
      anime: formData.get("category") as string,
      description: formData.get("description") as string,
      image: mainImgUrl,
      color: formData.get("color") as string,
      colors: colorInputs.map(c => c.value).filter((c) => c.trim() !== ""),
      isFeatured:
        formData.get("isFeatured") === "on"
          ? ("TRUE" as any)
          : ("FALSE" as any),
      isComingSoon:
        formData.get("isComingSoon") === "on"
          ? ("TRUE" as any)
          : ("FALSE" as any),
      images: galleryInputs.map(img => img.value).filter((url) => url.trim() !== ""),
      outOfStockColors: colorInputs.filter(c => c.isOutOfStock).map(c => c.value).filter((val) => val.trim() !== ""),
      outOfStockImages: [
        ...(isMainImageOutOfStock && mainImgUrl ? [mainImgUrl] : []),
        ...galleryInputs.filter(img => img.isOutOfStock).map(img => img.value).filter((val) => val.trim() !== "")
      ],
    };

    setProducts((prev) => {
      const existing = prev.findIndex((p) => p.id === productData.id);
      const formattedProd = {
        ...productData,
        isFeatured: parseBoolean(productData.isFeatured),
        isComingSoon: parseBoolean(productData.isComingSoon),
      };
      if (existing > -1) {
        const copy = [...prev];
        copy[existing] = formattedProd;
        return copy;
      }
      return [formattedProd, ...prev];
    });

    try {
      const response = await sheetApi.saveProduct(productData);
      if (response && !response.error) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        if (onRefreshProducts) onRefreshProducts();
      } else {
        const errorInfo =
          response?.error ||
          "Cloud rejected the update. Check data size (images might be too large for Google Sheets cells).";
        throw new Error(errorInfo);
      }
    } catch (err) {
      alert(
        "CRITICAL SYNC ERROR: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Permanently delete from cloud?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await sheetApi.deleteProduct(id);
      if (onRefreshProducts) onRefreshProducts();
    } catch (e) {
      alert("Delete failed on cloud. Refreshing state.");
      loadAllCloudData();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    const newCat = { id: `cat-${Date.now()}`, name: newCategoryName };
    setCategories((prev) => [...prev, newCat]);
    setNewCategoryName("");
    try {
      const resp = await sheetApi.saveCategory(newCat);
      if (resp && resp.error) throw new Error(resp.error);
    } catch (e) {
      alert(
        "Category Sync Failed: " + (e instanceof Error ? e.message : String(e)),
      );
      loadAllCloudData();
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this product line?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      const resp = await sheetApi.deleteCategory(id);
      if (resp && resp.error) throw new Error(resp.error);
    } catch (e) {
      alert("Delete Failed: " + (e instanceof Error ? e.message : String(e)));
      loadAllCloudData();
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    setUpdatingOrderId(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    try {
      const updated = { ...order, status: newStatus };
      const resp = await sheetApi.updateOrder(updated);
      if (resp && resp.error) throw new Error(resp.error);
    } catch (e) {
      alert(
        "Status Update Failed: " + (e instanceof Error ? e.message : String(e)),
      );
      loadAllCloudData();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSendReply = async () => {
    if (!selectedChat || !replyText.trim()) return;
    const newMessage: ChatMessage = {
      role: "admin",
      text: replyText,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...selectedChat.messages, newMessage];
    const updatedSession = {
      ...selectedChat,
      messages: updatedMessages,
      lastMessageAt: newMessage.timestamp,
    };
    setChats((prev) =>
      prev.map((c) => (c.id === selectedChat.id ? updatedSession : c)),
    );
    setSelectedChat(updatedSession);
    setReplyText("");
    await sheetApi.syncChat(updatedSession);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="w-full max-w-md bg-zinc-900 rounded-[40px] p-12 shadow-2xl animate-slideUp border border-zinc-800">
          <div className="flex justify-center mb-10">
            <Logo size="md" />
          </div>
          <div className="text-center mb-10">
            <h1 className="text-3xl font-light tracking-tight text-zinc-100 mb-2 font-serif">
              Executive Portal
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
              Secure Access Required
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 ml-4">
                Identifier
              </label>
              <input
                required
                type="text"
                className="w-full bg-zinc-800/50 border border-zinc-800 focus:border-zinc-100 focus:bg-zinc-800 p-5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-zinc-600 shadow-sm text-white"
                value={loginForm.id}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, id: e.target.value })
                }
                placeholder="Admin ID"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 ml-4">
                Passkey
              </label>
              <input
                required
                type="password"
                className="w-full bg-zinc-800/50 border border-zinc-800 focus:border-zinc-100 focus:bg-zinc-800 p-5 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-zinc-600 shadow-sm text-white"
                value={loginForm.pass}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, pass: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-zinc-100 text-zinc-900 py-6 rounded-2xl font-bold uppercase text-[10px] tracking-[0.4em] hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isLoggingIn ? "Authenticating..." : "Establish Connection"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-800 text-center">
            <button
              onClick={async () => {
                if (
                  confirm(
                    "Verify Cloud Infrastructure? This will ensure your Google Sheets columns are ready.",
                  )
                ) {
                  const res = await sheetApi.runCloudSetup();
                  if (res)
                    alert("Infrastructure Verified! Proceed with login.");
                }
              }}
              className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-100 transition-colors"
            >
              Verify Infrastructure Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans relative">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-8 right-8 z-[200] md:hidden w-16 h-16 bg-white text-zinc-900 rounded-full shadow-2xl flex items-center justify-center text-xl no-print"
      >
        <i className={`fas ${isSidebarOpen ? "fa-times" : "fa-bars"}`}></i>
      </button>

      {/* Sidebar */}
      <aside
        className={`w-80 bg-zinc-950 border-r border-zinc-800 p-10 fixed h-full z-[100] flex flex-col no-print transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="mb-16 flex justify-between items-center">
          <Logo size="sm" />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-zinc-500 hover:text-white"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="space-y-4 flex-1">
          {[
            { id: "dashboard", label: "Monitor", icon: "fa-chart-pie" },
            { id: "calendar", label: "Schedule", icon: "fa-calendar-alt" },
            { id: "inventory", label: "Vault", icon: "fa-layer-group" },
            { id: "categories", label: "Lines", icon: "fa-fingerprint" },
            { id: "orders", label: "Parcels", icon: "fa-box" },
            { id: "chats", label: "Intel", icon: "fa-comment-dots" },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => {
                setActiveView(view.id as AdminView);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between p-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all group ${activeView === view.id ? "bg-zinc-100 text-zinc-900 shadow-2xl -translate-y-0.5" : "text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900"}`}
            >
              <div className="flex items-center gap-4">
                <i
                  className={`fas ${view.icon} text-xs transition-transform group-hover:scale-125`}
                ></i>
                {view.label}
              </div>
              {activeView === view.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button
            onClick={() => setIsLoggedIn(false)}
            className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-power-off text-[8px]"></i>
            Terminate
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-80 p-6 md:p-12 lg:p-20 pt-24 w-full text-zinc-100 overflow-x-hidden">
        {isLoading && (
          <div className="fixed top-8 right-8 z-[100] flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-full shadow-2xl border border-zinc-800 animate-slideUp">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
              Syncing Intelligence...
            </span>
          </div>
        )}

        {activeView === "dashboard" && (
          <div className="space-y-20 animate-fadeIn">
            <header className="space-y-2">
              <h1 className="text-5xl font-light tracking-tight text-zinc-100 font-serif">
                Cloud <span className="italic text-zinc-500">Registry</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-500">
                Operational Real-time Metrics
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  label: "Cumulative Yield",
                  value: `৳${orders.reduce((a, b) => a + (Number(b.total) || 0), 0)}`,
                  icon: "fa-circle-dollar-to-slot",
                  detail: "Gross Revenue",
                },
                {
                  label: "Active Pipeline",
                  value: orders.filter(
                    (o) => o.status !== "Delivered" && o.status !== "Cancelled",
                  ).length,
                  icon: "fa-route",
                  detail: "Pending Delivery",
                },
                {
                  label: "Inventory Units",
                  value: products.length,
                  icon: "fa-cube",
                  detail: "Unique Products",
                },
                {
                  label: "Inquiry Threads",
                  value: chats.filter((c) => c.status === "active").length,
                  icon: "fa-satellite-dish",
                  detail: "Active Support",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group bg-zinc-900 rounded-[32px] p-10 border border-zinc-800 hover:border-zinc-700 transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-10 group-hover:bg-zinc-100 transition-colors duration-500">
                    <i
                      className={`fas ${stat.icon} text-zinc-500 group-hover:text-zinc-900 transition-colors duration-500`}
                    ></i>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-light tracking-tighter text-zinc-100 mb-6">
                    {stat.value}
                  </p>
                  <p className="text-[8px] uppercase tracking-widest text-zinc-600 mt-auto">
                    {stat.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Order Preview */}
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <h3 className="text-xl font-light font-serif tracking-tight text-zinc-100">
                    Recent{" "}
                    <span className="italic text-zinc-500">Transactions</span>
                  </h3>
                  <button
                    onClick={() => setActiveView("orders")}
                    className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    Manifest Logs
                  </button>
                </div>
                <div className="bg-zinc-900 rounded-[40px] p-4 border border-zinc-800 divide-y divide-zinc-800/50 overflow-hidden shadow-sm">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center p-6 hover:bg-zinc-800 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-black group-hover:bg-zinc-100 group-hover:text-zinc-900 transition-all">
                          #
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase text-zinc-100">
                            {order.customer.name}
                          </p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                            {new Date(order.date).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-light tracking-tighter text-zinc-100 mb-1">
                          ৳{order.total}
                        </p>
                        <span
                          className={`text-[8px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${order.status === "Delivered" ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-500"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="p-20 text-center text-zinc-600 font-serif italic text-sm">
                      No recent transactions indexed.
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Preview */}
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <h3 className="text-xl font-light font-serif tracking-tight text-zinc-100">
                    Live{" "}
                    <span className="italic text-zinc-500">Communications</span>
                  </h3>
                  <button
                    onClick={() => setActiveView("chats")}
                    className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    Communication Hub
                  </button>
                </div>
                <div className="bg-zinc-900 rounded-[40px] p-4 border border-zinc-800 divide-y divide-zinc-800/50 overflow-hidden shadow-sm">
                  {chats.slice(0, 5).map((chat) => (
                    <div
                      key={chat.id}
                      className="flex justify-between items-center p-6 hover:bg-zinc-800 transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedChat(chat);
                        setActiveView("chats");
                      }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${chat.status === "active" ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-600"}`}
                        >
                          <i className="fas fa-comment text-[10px]"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black uppercase text-zinc-100 truncate">
                            {chat.userName}
                          </p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-tight truncate leading-none">
                            {chat.messages[chat.messages.length - 1]?.text ||
                              "Established session"}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <p className="text-[8px] font-black text-zinc-600 uppercase">
                          {new Date(chat.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <div className="p-20 text-center text-zinc-600 font-serif italic text-sm">
                      Communication silence.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "inventory" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end border-b-4 border-zinc-100 pb-8">
              <h1 className="text-5xl font-black uppercase italic text-white">
                Inventory
              </h1>
              <button
                onClick={() => handleOpenProductModal(null)}
                className="bg-zinc-100 text-zinc-900 px-8 py-4 font-black uppercase text-[10px] shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:translate-y-[-2px] hover:bg-white transition-all"
              >
                Add New Product
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-zinc-900 border-2 border-zinc-800 p-6 flex gap-6 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.5)] transition-all group"
                >
                  <div className="relative w-24 h-32 flex-shrink-0">
                    {p.image && (
                      <img
                        src={p.image}
                        className="w-full h-full bg-zinc-800 border-2 border-zinc-700 object-cover"
                      />
                    )}
                    {!p.image && (
                      <div className="w-full h-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-600">
                        <i className="fas fa-image"></i>
                      </div>
                    )}
                    {p.isFeatured && (
                      <div className="absolute -top-2 -left-2 bg-yellow-400 text-black text-[6px] font-black px-1 uppercase border border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] z-10">
                        Featured
                      </div>
                    )}
                    {p.isComingSoon && (
                      <div className="absolute -top-2 right-2 bg-blue-500 text-white text-[6px] font-black px-1 uppercase border border-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] z-10">
                        Coming Soon
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h3
                        className="font-black uppercase text-xs text-zinc-100 flex-1 truncate"
                        title={p.name}
                      >
                        {p.name}
                      </h3>
                      <div className="flex gap-4 shrink-0">
                        <button
                          onClick={() => handleOpenProductModal(p)}
                          className="text-zinc-400 hover:text-white hover:scale-125 transition-transform"
                        >
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-red-500/70 hover:text-red-500 hover:scale-125 transition-transform"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-black mt-1 text-zinc-300">
                      {typeof p.price === "number" ? `৳${p.price}` : p.price}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <p className="text-[8px] font-black uppercase bg-zinc-100 text-zinc-900 px-2 py-0.5 inline-block">
                        {p.category}
                      </p>
                      {p.images && p.images.length > 0 && (
                        <p className="text-[8px] font-black uppercase bg-zinc-800 text-zinc-500 px-2 py-0.5 inline-block">
                          +{p.images.length} Photos
                        </p>
                      )}
                      {p.outOfStockColors && p.outOfStockColors.length > 0 && (
                        <span className="text-[8px] font-black uppercase bg-red-950 text-red-400 border border-red-500/20 px-2 py-0.5 inline-block">
                          {p.outOfStockColors.length} Out Color{p.outOfStockColors.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {p.outOfStockImages && p.outOfStockImages.length > 0 && (
                        <span className="text-[8px] font-black uppercase bg-red-950 text-red-500 border border-red-500/25 px-2 py-0.5 inline-block">
                          {p.outOfStockImages.length} Out Photo{p.outOfStockImages.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "categories" && (
          <div className="max-w-4xl space-y-12 animate-fadeIn">
            <h1 className="text-5xl font-black uppercase italic border-b-4 border-zinc-100 pb-6 text-white">
              Product Lines
            </h1>
            <div className="bg-zinc-900 border-4 border-zinc-800 p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,0.3)]">
              <h3 className="text-xs font-black uppercase mb-4 tracking-widest text-zinc-500">
                Create New Classification
              </h3>
              <div className="flex gap-4">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 border-2 border-zinc-800 bg-zinc-950 p-4 text-xs font-bold outline-none text-white focus:border-zinc-100 transition-colors"
                  placeholder="e.g. Minimalist Core"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={isAddingCategory || !newCategoryName.trim()}
                  className={`bg-zinc-100 text-zinc-900 px-10 font-black uppercase text-[10px] flex items-center gap-2 transition-all ${isAddingCategory ? "opacity-50" : "hover:bg-white"}`}
                >
                  {isAddingCategory ? (
                    <i className="fas fa-sync fa-spin"></i>
                  ) : (
                    "Sync Category"
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-zinc-900 border-2 border-zinc-800 p-6 flex justify-between items-center hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.5)] transition-all"
                >
                  <span className="font-black uppercase text-xs tracking-widest text-zinc-100">
                    {cat.name}
                  </span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-500/70 hover:text-red-500 hover:scale-125 transition-transform px-2 py-1"
                  >
                    <i className="fas fa-trash-can"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "orders" && (
          <div className="space-y-16 animate-fadeIn">
            <header className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-zinc-800 pb-12">
              <div className="space-y-2">
                <h1 className="text-5xl font-light tracking-tight text-zinc-100 font-serif">
                  Parcel <span className="italic text-zinc-500">Registry</span>
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">
                  Synchronized Shipment Manifest
                </p>
              </div>

              <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-[32px] border border-zinc-800">
                <div className="flex items-center gap-3 px-6 py-3 bg-zinc-800 rounded-[24px] shadow-sm border border-zinc-700">
                  <i className="fas fa-calendar-day text-zinc-500 text-xs"></i>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 outline-none cursor-pointer"
                  />
                  {filterDate && (
                    <button
                      onClick={() => setFilterDate("")}
                      className="text-zinc-500 hover:text-zinc-100 transition-colors ml-2"
                    >
                      <i className="fas fa-times-circle"></i>
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="bg-zinc-900 rounded-[48px] overflow-hidden border border-zinc-800 shadow-sm relative group">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-800/50">
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                        Identifier
                      </th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                        Recipient
                      </th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                        Payload
                      </th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                        Yield
                      </th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800 text-center">
                        Protocol
                      </th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                        Status Vector
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {orders
                      .filter((order) => {
                        if (!filterDate) return true;
                        // Format order.date to YYYY-MM-DD for comparison
                        const d = new Date(order.date);
                        const orderDateStr = d.toISOString().split("T")[0];
                        return orderDateStr === filterDate;
                      })
                      .map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-zinc-800/50 transition-colors group/row"
                        >
                          <td className="p-8">
                            <div className="bg-zinc-800 text-zinc-500 text-[10px] font-black px-3 py-1 rounded-full inline-block group-hover/row:bg-zinc-100 group-hover/row:text-zinc-900 transition-all">
                              #{order.id}
                            </div>
                          </td>
                          <td className="p-8">
                            <p className="text-[11px] font-black uppercase text-zinc-100">
                              {order.customer.name}
                            </p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                              {order.customer.phone}
                            </p>
                          </td>
                          <td className="p-8">
                            <div className="space-y-1">
                              <p className="text-[10px] text-zinc-500 font-bold uppercase">
                                {order.items.length} units indexed
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {order.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[7px] font-black uppercase px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-sm border border-zinc-700"
                                  >
                                    {item.selectedColor || "No Color"}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="p-8 font-light text-sm tracking-tighter text-zinc-100">
                            ৳{order.total}
                          </td>
                          <td className="p-8">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center hover:bg-zinc-100 hover:text-zinc-900 transition-all shadow-sm hover:shadow-xl active:scale-95"
                              >
                                <i className="fas fa-expand-alt text-xs"></i>
                              </button>
                              <button
                                onClick={() => handlePrintManifest(order)}
                                title="Print Manifest (Ctrl+P)"
                                className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center hover:bg-zinc-100 hover:text-zinc-900 transition-all shadow-sm hover:shadow-xl active:scale-95"
                              >
                                <i className="fas fa-print text-xs"></i>
                              </button>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1">
                                <select
                                  value={order.status}
                                  disabled={updatingOrderId === order.id}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      e.target.value as any,
                                    )
                                  }
                                  className={`w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-100 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none transition-all appearance-none cursor-pointer ${order.status === "Delivered" ? "text-green-400" : "text-zinc-400"}`}
                                >
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Out for Delivery">
                                    In Transit
                                  </option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                  <i className="fas fa-chevron-down text-[8px]"></i>
                                </div>
                              </div>
                              {updatingOrderId === order.id && (
                                <i className="fas fa-circle-notch fa-spin text-zinc-500"></i>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === "calendar" && (
          <div className="space-y-16 animate-fadeIn">
            <header className="space-y-2 border-b border-zinc-800 pb-12">
              <h1 className="text-5xl font-light tracking-tight text-zinc-100 font-serif">
                Daily <span className="italic text-zinc-500">Schedule</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">
                Order Dispatch Calendar
              </p>
            </header>

            <div className="space-y-12">
              {(() => {
                const grouped = orders.reduce(
                  (acc, order) => {
                    const dateObj = new Date(order.date);
                    const key = dateObj.toLocaleDateString([], {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(order);
                    return acc;
                  },
                  {} as Record<string, Order[]>,
                );

                return Object.entries(grouped).map(([dateLabel, dayOrders]) => (
                  <div
                    key={dateLabel}
                    className="bg-zinc-900 rounded-[40px] border border-zinc-800 p-8 shadow-sm"
                  >
                    <div className="mb-6 pb-4 border-b border-zinc-800 flex justify-between items-center">
                      <h2 className="text-xl font-serif text-zinc-100">
                        {dateLabel}
                      </h2>
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                        {dayOrders.length} Parcels
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {dayOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800 hover:border-zinc-700 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded-md text-zinc-400 shadow-sm border border-zinc-800">
                              #{order.id}
                            </span>
                            <span
                              className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${order.status === "Delivered" ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-500"}`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-zinc-100 uppercase truncate mb-1">
                            {order.customer.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-medium truncate text-ellipsis">
                            {order.customer.district || "Location unavailable"}{" "}
                            - {order.customer.thana || "Unknown"}
                          </p>
                          <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                            <span className="text-[10px] text-zinc-600 font-bold uppercase">
                              {order.items.length} units
                            </span>
                            <span className="text-sm font-light text-zinc-100 italic font-serif">
                              ৳{order.total}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
              {orders.length === 0 && (
                <div className="text-center p-20 text-zinc-600 font-serif text-lg italic">
                  No data on timeline.
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "chats" && (
          <div className="h-[calc(100vh-160px)] flex flex-col md:flex-row gap-8 animate-fadeIn">
            <div
              className={`${selectedChat ? "hidden md:flex" : "flex"} w-full md:w-80 bg-zinc-900 border-4 border-zinc-800 flex-col h-full`}
            >
              <div className="p-4 border-b-4 border-zinc-800 bg-zinc-950 text-zinc-100 text-[10px] font-black uppercase tracking-widest">
                Inquiries
              </div>
              <div className="flex-1 overflow-y-auto">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-6 text-left border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-all ${selectedChat?.id === chat.id ? "bg-zinc-800 border-l-8 border-l-zinc-100" : ""}`}
                  >
                    <div className="flex justify-between mb-1">
                      <p className="font-black uppercase text-[10px] text-zinc-100">
                        {chat.userName}
                      </p>
                      <span
                        className={`w-2 h-2 rounded-full ${chat.status === "active" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-zinc-700"}`}
                      ></span>
                    </div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase truncate">
                      {chat.messages[chat.messages.length - 1]?.text ||
                        "No messages"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`${selectedChat ? "flex" : "hidden md:flex"} flex-1 bg-zinc-900 border-4 border-zinc-800 flex-col h-full`}
            >
              {selectedChat ? (
                <>
                  <div className="p-6 border-b-4 border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden text-zinc-400"
                      >
                        <i className="fas fa-arrow-left"></i>
                      </button>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-zinc-100">
                          {selectedChat.userName}
                        </h3>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase">
                          {selectedChat.userEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-zinc-950/50">
                    {selectedChat.messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[70%] p-4 border-2 border-zinc-800 text-[11px] font-bold ${m.role === "user" ? "bg-zinc-800 text-zinc-100" : "bg-zinc-100 text-zinc-900"}`}
                        >
                          <p className="text-[7px] font-black uppercase mb-1 opacity-70 tracking-widest">
                            {m.role === "user" ? "CUSTOMER" : "STAFF"}
                          </p>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 border-t-4 border-zinc-800 bg-zinc-900 flex gap-4">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                      placeholder="Type staff response..."
                      className="flex-1 border-2 border-zinc-800 bg-zinc-950 p-4 text-xs font-bold outline-none text-white focus:border-zinc-100"
                    />
                    <button
                      onClick={handleSendReply}
                      className="bg-zinc-100 text-zinc-900 px-10 font-black uppercase text-[10px] hover:bg-white transition-colors"
                    >
                      Dispatch
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
                  <i className="fas fa-comments text-6xl mb-6"></i>
                  <p className="font-black uppercase text-xs tracking-widest">
                    Select interaction
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Product Management Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/95 backdrop-blur-md">
          <div className="bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-zinc-800 p-6 sm:p-10 shadow-2xl animate-slideUp custom-scrollbar">
            <div className="flex justify-between items-start border-b-4 border-zinc-800 pb-4 mb-8">
              <h2 className="text-3xl font-black uppercase italic text-zinc-100">
                {editingProduct
                  ? "Technical Spec Revision"
                  : "New Product Entry"}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-white hover:scale-125 transition-transform"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Title
                  </label>
                  <input
                    name="name"
                    defaultValue={editingProduct?.name}
                    required
                    className="w-full border-2 border-zinc-800 p-4 text-xs font-bold outline-none bg-zinc-950 text-white focus:bg-zinc-800 focus:border-zinc-100 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Price (BDT) / Prebook
                  </label>
                  <input
                    name="price"
                    type="text"
                    defaultValue={editingProduct?.price}
                    required
                    placeholder="Amount or 'Prebook now'"
                    className="w-full border-2 border-zinc-800 p-4 text-xs font-bold outline-none bg-zinc-950 text-white focus:bg-zinc-800 focus:border-zinc-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Category / Anime
                  </label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category}
                    required
                    className="w-full border-2 border-zinc-800 p-4 text-xs font-bold outline-none bg-zinc-950 text-white focus:bg-zinc-800 focus:border-zinc-100 transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Default Label (Legacy)
                  </label>
                  <input
                    name="color"
                    defaultValue={editingProduct?.color}
                    className="w-full border-2 border-zinc-800 p-4 text-xs font-bold outline-none bg-zinc-950 text-white focus:bg-zinc-800 focus:border-zinc-100 transition-all"
                    placeholder="e.g. Regular Black"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Available Color Variants
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorInputs.map((colorItem, idx) => (
                    <div
                      key={colorItem.id}
                      className={`flex items-center gap-2 bg-zinc-950 text-white px-3 py-2 border-2 transition-colors ${colorItem.isOutOfStock ? "border-red-600/50" : "border-zinc-800"}`}
                    >
                      <input
                        value={colorItem.value}
                        onChange={(e) => {
                          const next = [...colorInputs];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setColorInputs(next);
                        }}
                        className="bg-transparent border-b border-zinc-800 text-[10px] font-black uppercase outline-none w-24 focus:border-zinc-500"
                        placeholder="e.g. Jet Black"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...colorInputs];
                          next[idx] = { ...next[idx], isOutOfStock: !next[idx].isOutOfStock };
                          setColorInputs(next);
                        }}
                        className={`text-[8px] font-black uppercase px-2 py-1 rounded transition-colors ${
                          colorItem.isOutOfStock
                            ? "bg-red-950 text-red-500 border border-red-500/30 font-black animate-pulse"
                            : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                        }`}
                        title="Toggle Out of Stock status for this color variant"
                      >
                        {colorItem.isOutOfStock ? "Stock Out" : "In Stock"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setColorInputs((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-red-500/70 hover:text-red-500 ml-1"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setColorInputs([...colorInputs, { id: Math.random().toString(), value: "" }])}
                    className="px-4 py-2 border-2 border-dashed border-zinc-800 text-zinc-600 [9px] font-black uppercase hover:bg-zinc-800 hover:text-zinc-400 transition-all"
                  >
                    + Add Color
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Primary Product Photo
                </label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-32 border-2 border-zinc-800 overflow-hidden bg-zinc-950 flex-shrink-0 relative">
                    {mainImageBase64 ? (
                      <>
                        <img
                          src={mainImageBase64}
                          className="w-full h-full object-cover"
                        />
                        {isMainImageOutOfStock && (
                          <div className="absolute inset-0 bg-red-900/60 backdrop-blur-xs flex items-center justify-center border border-red-500">
                            <span className="text-[8px] font-black uppercase tracking-widest text-red-100 bg-red-600 px-1 py-0.5 animate-pulse">STOCK OUT</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800">
                        <i className="fas fa-image text-2xl"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        name="image_link"
                        value={
                          mainImageBase64.startsWith("data:")
                            ? ""
                            : mainImageBase64
                        }
                        onChange={(e) => setMainImageBase64(e.target.value)}
                        className="flex-1 border-2 border-zinc-800 p-3 text-[10px] font-bold outline-none bg-zinc-950 text-white focus:border-zinc-600"
                        placeholder="Paste URL or upload below..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => mainFileRef.current?.click()}
                        className="flex-1 py-3 bg-zinc-100 text-zinc-900 text-[9px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                      >
                        <i className="fas fa-upload mr-2"></i> Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMainImageOutOfStock(!isMainImageOutOfStock)}
                        className={`px-4 py-3 text-[9px] font-black uppercase border transition-all ${
                          isMainImageOutOfStock
                            ? "bg-red-950 text-red-500 border-red-500/50 animate-pulse"
                            : "bg-zinc-800 text-zinc-400 border-transparent hover:text-white"
                        }`}
                        title="Toggle Stock Out status for the main product photo"
                      >
                        {isMainImageOutOfStock ? "Stock Out" : "In Stock"}
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={mainFileRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleMainFileChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Additional Gallery Photos
                </label>
                <div className="space-y-3">
                  {galleryInputs.map((imgItem, idx) => (
                    <div
                      key={imgItem.id}
                      className={`flex gap-2 items-center bg-zinc-950 p-2 border-2 transition-colors ${imgItem.isOutOfStock ? "border-red-600/50" : "border-zinc-800"}`}
                    >
                      <div className="w-10 h-12 bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0 relative">
                        {imgItem.value ? (
                          <>
                            <img
                              src={imgItem.value}
                              className="w-full h-full object-cover"
                            />
                            {imgItem.isOutOfStock && (
                              <div className="absolute inset-0 bg-red-900/60 backdrop-blur-xs flex items-center justify-center border border-red-500">
                                <span className="text-[6px] font-black tracking-widest text-red-100 bg-red-600 px-0.5 animate-pulse">OUT</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-800">
                            <i className="fas fa-camera text-[10px]"></i>
                          </div>
                        )}
                      </div>
                      <input
                        value={imgItem.value.startsWith("data:") ? "Uploaded File" : imgItem.value}
                        onChange={(e) => {
                          const next = [...galleryInputs];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setGalleryInputs(next);
                        }}
                        className="flex-1 border-b border-zinc-800 p-2 text-[9px] font-bold outline-none bg-transparent text-white"
                        placeholder="Paste sub-image URL..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...galleryInputs];
                          next[idx] = { ...next[idx], isOutOfStock: !next[idx].isOutOfStock };
                          setGalleryInputs(next);
                        }}
                        className={`px-3 py-1 text-[8px] font-black transition-all self-stretch uppercase flex items-center justify-center border ${
                          imgItem.isOutOfStock
                            ? "bg-red-950 text-red-500 border-red-500/30 animate-pulse font-black"
                            : "bg-zinc-800/80 text-zinc-400 border-transparent hover:text-white"
                        }`}
                        title="Toggle Out of Stock status for this gallery photo"
                      >
                        {imgItem.isOutOfStock ? "Stock Out" : "In Stock"}
                      </button>
                      <label className="bg-zinc-800 text-zinc-400 px-3 py-1 text-[8px] font-black cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors self-stretch flex items-center">
                        UPLOAD{" "}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleGalleryFileChange(e, idx)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryInputs((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-red-500/70 hover:text-red-500 px-3 hover:scale-125 transition-transform"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryInputs([...galleryInputs, { id: Math.random().toString(), value: "" }])}
                  className="w-full py-3 border-2 border-dashed border-zinc-800 text-zinc-600 text-[9px] font-black uppercase hover:bg-zinc-800 hover:text-zinc-400 transition-all"
                >
                  + Add Sub-Image Entry
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description}
                  className="w-full border-2 border-zinc-800 p-4 text-xs font-bold outline-none h-20 bg-zinc-950 text-white focus:bg-zinc-800 focus:border-zinc-100 resize-none transition-all"
                />
              </div>

              <div className="flex items-center gap-4 bg-zinc-950 p-4 border-2 border-zinc-800">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={
                    editingProduct
                      ? parseBoolean(editingProduct.isFeatured)
                      : false
                  }
                  id="isFeatured"
                  className="w-5 h-5 accent-zinc-100 cursor-pointer"
                />
                <label
                  htmlFor="isFeatured"
                  className="text-[10px] font-black uppercase italic text-zinc-400 cursor-pointer"
                >
                  Live Featured Banner (Show on Home Slider)
                </label>
              </div>

              <div className="flex items-center gap-4 bg-zinc-950 p-4 border-2 border-zinc-800">
                <input
                  type="checkbox"
                  name="isComingSoon"
                  defaultChecked={
                    editingProduct
                      ? parseBoolean(editingProduct.isComingSoon)
                      : false
                  }
                  id="isComingSoon"
                  className="w-5 h-5 accent-zinc-100 cursor-pointer"
                />
                <label
                  htmlFor="isComingSoon"
                  className="text-[10px] font-black uppercase italic text-zinc-400 cursor-pointer"
                >
                  Coming Soon Product
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-8 py-4 border-2 border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all font-black uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 bg-zinc-100 text-zinc-900 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest disabled:opacity-50 hover:bg-white transition-all shadow-lg"
                >
                  {isSyncing
                    ? "Synchronizing Cloud..."
                    : editingProduct
                      ? "Commit Changes"
                      : "Register Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal (Quick View) */}
      {selectedOrder &&
        createPortal(
          <div className="fixed inset-0 z-[160] flex items-start justify-center p-0 md:p-12 bg-zinc-950/40 backdrop-blur-3xl animate-fadeIn print-active-overlay overflow-y-auto">
            <div className="bg-zinc-900 w-full max-w-5xl md:rounded-[60px] p-12 md:p-20 shadow-2xl relative flex flex-col md:flex-row gap-16 print-paper my-auto min-h-full md:min-h-0 border border-zinc-800">
              <div className="absolute top-12 right-12 flex gap-4 no-print z-50">
                <button
                  onClick={() => window.print()}
                  title="Print (Ctrl+P)"
                  className="w-14 h-14 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center text-xl hover:bg-white hover:-translate-y-1 transition-all shadow-xl active:scale-95"
                >
                  <i className="fas fa-print"></i>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-14 h-14 bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center text-xl hover:bg-zinc-100 hover:text-zinc-900 hover:-translate-y-1 transition-all shadow-xl active:scale-95"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="flex-1 flex flex-col pt-10 print-main">
                <div className="mb-16 border-b border-zinc-800 pb-12">
                  <div className="mb-8 font-serif">
                    <Logo size="sm" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 mb-4">
                    Official Manifest Record
                  </p>
                  <h2 className="text-4xl md:text-6xl font-light text-zinc-100 font-serif leading-none tracking-tighter">
                    Batch{" "}
                    <span className="italic text-zinc-500">
                      #{selectedOrder.id}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
                        Recipient Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                            Customer Name
                          </p>
                          <p className="text-2xl font-light text-zinc-100 font-serif lowercase italic">
                            {selectedOrder.customer.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                            Contact Info
                          </p>
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                            {selectedOrder.customer.phone}
                          </p>
                          <p className="text-[9px] text-zinc-600 uppercase tracking-tight">
                            {selectedOrder.customer.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">
                        Logistic Point
                      </h4>
                      <div className="p-8 bg-zinc-950 rounded-[32px] border border-zinc-800 space-y-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                            Full Address / Location
                          </p>
                          <p className="text-xs font-medium text-zinc-300 italic leading-relaxed">
                            {selectedOrder.customer.address}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                            Thana / District
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">
                            {selectedOrder.customer.thana},{" "}
                            {selectedOrder.customer.district}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="bg-zinc-100 text-zinc-900 rounded-[40px] p-10 space-y-8 flex-1 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                      <div className="relative z-10 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                          Settlement Registry
                        </h4>
                        <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                          <span>Methodology</span>
                          <span className="text-zinc-900">
                            {selectedOrder.paymentMethod}
                          </span>
                        </div>
                        {selectedOrder.transactionInfo && (
                          <div className="pt-6 border-t border-zinc-200 space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-400 block">
                              Identifier Hash
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-tighter text-zinc-500 block break-all">
                              {selectedOrder.transactionInfo}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="relative z-10 pt-10 border-t border-zinc-200">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 block mb-6">
                          Total Investment Yielded
                        </span>
                        <span className="text-6xl font-light text-zinc-900 font-serif leading-none tracking-tighter italic">
                          ৳{selectedOrder.total}
                        </span>
                      </div>

                      <div className="absolute bottom-0 right-0 p-8 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fas fa-fingerprint text-[120px]"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-[380px] flex flex-col pt-10 md:pt-20 print-sidebar">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-10 border-b border-zinc-800 pb-4">
                  Manifest Contents
                </h4>
                <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar print-items">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-6 items-center">
                      <div className="w-16 h-20 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex-shrink-0 p-1">
                        <div className="w-full h-full rounded-xl overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-zinc-100 truncate leading-none mb-1">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-3 mb-3">
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                            Qty: {item.quantity}
                          </p>
                          {item.selectedColor && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-100"></div>
                              <p className="text-[9px] text-zinc-100 font-black uppercase tracking-tighter">
                                {item.selectedColor}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-light text-zinc-100">
                          {typeof item.price === "number"
                            ? `৳${item.price * item.quantity}`
                            : item.quantity > 1
                              ? `${item.price} (x${item.quantity})`
                              : item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="py-10 text-center opacity-30 mt-auto">
                  <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-600">
                    Authenticated by Cuteriaa Syndicate
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Admin;
