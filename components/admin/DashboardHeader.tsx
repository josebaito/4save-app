import { Button } from "@/components/ui/button";
import { RefreshCw, Radio } from "lucide-react";

interface DashboardHeaderProps {
    onRefresh: () => void;
    onSync: () => void;
    loading?: boolean;
}

export function DashboardHeader({ onRefresh, onSync, loading }: DashboardHeaderProps) {
    return (
        <div className="sticky top-0 z-50 w-full mb-6 pt-4 pb-4 bg-background/80 backdrop-blur-md border-b border-border/50 transition-all duration-200">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight flex items-center gap-3">
                        Dashboard
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                    </h1>
                    <p className="text-sm font-body text-muted-foreground uppercase tracking-widest mt-1">
                        Command Center &bull; Live Monitor
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                        className="font-mono text-xs uppercase tracking-wider border-border hover:bg-primary hover:text-primary-foreground transition-colors group"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        refresh_data
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSync}
                        disabled={loading}
                        className="font-mono text-xs uppercase tracking-wider border-border hover:bg-secondary transition-colors"
                    >
                        <Radio className="w-3.5 h-3.5 mr-2" />
                        sync_network
                    </Button>
                </div>
            </div>
        </div>
    );
}
