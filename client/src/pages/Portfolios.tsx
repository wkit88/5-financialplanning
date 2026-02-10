import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plus,
  Building2,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  FolderOpen,
  LogIn,
} from "lucide-react";

function formatRM(val: number): string {
  return "RM " + val.toLocaleString("en-MY", { maximumFractionDigits: 0 });
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Portfolios() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    data: portfolioList,
    isLoading,
    refetch,
  } = trpc.portfolio.list.useQuery(undefined, { enabled: isAuthenticated });

  const renameMutation = trpc.portfolio.rename.useMutation({
    onSuccess: () => {
      toast.success("Portfolio renamed");
      setRenameId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => {
      toast.success("Portfolio deleted");
      setDeleteId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Unauthenticated state
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071e3] to-[#34c759] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-[#1d1d1f] leading-tight">PropertyLab</h1>
                <p className="text-[11px] text-[#86868b] leading-tight">Portfolio Simulator</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#34c759] flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">Welcome to PropertyLab</h2>
          <p className="text-[#86868b] text-center max-w-md mb-6">
            Sign in to create and manage your property investment portfolios with AI-powered analysis.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-[#0071e3] hover:bg-[#0077ED] text-white px-6 h-11 rounded-xl text-[15px] font-medium"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In to Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071e3] to-[#34c759] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-[#1d1d1f] leading-tight">PropertyLab</h1>
              <p className="text-[11px] text-[#86868b] leading-tight">Portfolio Simulator</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-[13px] text-[#86868b] hidden sm:inline">
                {user.name || user.email || "User"}
              </span>
            )}
            <Button
              onClick={() => navigate("/simulator")}
              className="bg-[#0071e3] hover:bg-[#0077ED] text-white px-4 h-9 rounded-xl text-[13px] font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add New Portfolio
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-[28px] font-bold text-[#1d1d1f] tracking-tight">My Portfolios</h2>
          <p className="text-[15px] text-[#86868b] mt-1">
            Your saved property and stock investment scenarios.
          </p>
        </div>

        {/* Loading State */}
        {(authLoading || isLoading) && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin mb-3" />
            <p className="text-[#86868b] text-[14px]">Loading your portfolios...</p>
          </div>
        )}

        {/* Empty State */}
        {!authLoading && !isLoading && portfolioList && portfolioList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-[#f5f5f7] border-2 border-dashed border-[#d2d2d7] flex items-center justify-center mb-5">
              <FolderOpen className="w-8 h-8 text-[#86868b]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#1d1d1f] mb-1.5">No portfolios yet</h3>
            <p className="text-[14px] text-[#86868b] text-center max-w-sm mb-6">
              Create your first portfolio by running a property and stock investment simulation.
            </p>
            <Button
              onClick={() => navigate("/simulator")}
              className="bg-[#0071e3] hover:bg-[#0077ED] text-white px-6 h-11 rounded-xl text-[15px] font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Portfolio
            </Button>
          </div>
        )}

        {/* Portfolio Table */}
        {!authLoading && !isLoading && portfolioList && portfolioList.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#d2d2d7]/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#d2d2d7]/60 bg-[#f5f5f7]/50">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      Portfolio Name
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      10-Year Equity
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      30-Year Equity
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      Stock Value
                    </th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      Combined 30Y
                    </th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      Properties
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-center px-3 py-3 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider w-12">
                      
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioList.map((p: any) => {
                    const summary = p.summary as any;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-[#d2d2d7]/30 hover:bg-[#f5f5f7]/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/portfolio/${p.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0071e3]/10 to-[#34c759]/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-[#0071e3]" />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-[#86868b]">
                                {summary?.purchasePrice ? formatRM(summary.purchasePrice) + " / property" : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-[14px] font-medium text-[#1d1d1f]">
                            {summary?.equity10 ? formatRM(summary.equity10) : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-[14px] font-medium text-[#1d1d1f]">
                            {summary?.equity30 ? formatRM(summary.equity30) : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {summary?.stockValue30 ? (
                            <span className="text-[14px] font-medium text-[#34c759]">
                              {formatRM(summary.stockValue30)}
                            </span>
                          ) : (
                            <span className="text-[13px] text-[#86868b]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {summary?.combined30 ? (
                            <span className="text-[14px] font-bold text-[#5856d6]">
                              {formatRM(summary.combined30)}
                            </span>
                          ) : (
                            <span className="text-[14px] font-medium text-[#1d1d1f]">
                              {summary?.equity30 ? formatRM(summary.equity30) : "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1d1d1f]">
                            <Building2 className="w-3.5 h-3.5 text-[#86868b]" />
                            {summary?.properties ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-left">
                          <span className="text-[13px] text-[#86868b]">
                            {formatDate(p.createdAt)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4 text-[#86868b]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => navigate(`/portfolio/${p.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setRenameId(p.id);
                                  setRenameName(p.name);
                                }}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Rename Dialog */}
      <Dialog open={renameId !== null} onOpenChange={() => setRenameId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Portfolio</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Portfolio name"
            className="mt-2"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0071e3] hover:bg-[#0077ED] text-white"
              disabled={!renameName.trim() || renameMutation.isPending}
              onClick={() => {
                if (renameId && renameName.trim()) {
                  renameMutation.mutate({ id: renameId, name: renameName.trim() });
                }
              }}
            >
              {renameMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[#86868b] mt-2">
            Are you sure you want to delete this portfolio? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteId) deleteMutation.mutate({ id: deleteId });
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
