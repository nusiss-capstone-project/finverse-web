"use client";

import { ArrowDownCircle, Gift } from "lucide-react";

import { TransactionStatusBadge } from "@/components/user/transaction-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WalletTransaction } from "@/lib/web/user-app-api";
import { formatDateTime, formatMoney } from "@/lib/web/user-app-api";

function transactionIcon(type: string) {
  return type.toUpperCase().includes("REWARD") ? Gift : ArrowDownCircle;
}

export function TransactionsTable({ rows }: { rows: WalletTransaction[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-emerald-950/10">
      <Table className="border-0">
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
              Transaction No
            </TableHead>
            <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
              Type
            </TableHead>
            <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
              Amount
            </TableHead>
            <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
              Status
            </TableHead>
            <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
              Balance After
            </TableHead>
            <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-500">
              Created At
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((tx, index) => {
            const Icon = transactionIcon(tx.type);
            return (
              <TableRow
                key={`${tx.transactionNo}-${index}`}
                className="border-white/5 hover:bg-white/[0.03]"
              >
                <TableCell className="px-5 py-4 font-mono text-xs text-slate-400">
                  {tx.transactionNo}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-white">
                      {tx.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 text-sm font-semibold tabular-nums text-emerald-300">
                  +{formatMoney(tx.amount, tx.currency)}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <TransactionStatusBadge status={tx.status} />
                </TableCell>
                <TableCell className="px-5 py-4 text-sm tabular-nums text-slate-400">
                  {tx.balanceAfter != null
                    ? formatMoney(tx.balanceAfter, tx.currency)
                    : "—"}
                </TableCell>
                <TableCell className="px-5 py-4 text-sm text-slate-400">
                  {formatDateTime(tx.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
