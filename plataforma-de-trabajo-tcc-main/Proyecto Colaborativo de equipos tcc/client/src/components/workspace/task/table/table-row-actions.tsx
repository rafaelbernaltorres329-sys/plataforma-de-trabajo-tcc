import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";
import TaskMessagesDialog from "../table/TaskMessagesDialog"


import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/resuable/confirm-dialog";
import { TaskType } from "@/types/api.type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { deleteTaskMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import EditTaskDialog from "../edit-task-dialog"; // Import the Edit Dialog

interface DataTableRowActionsProps {
  row: Row<TaskType>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [openDeleteDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false); // State for edit dialog
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTaskMutationFn,
  });

  const task = row.original;
  const taskId = task._id as string;
  const taskCode = task.taskCode;

  const handleConfirm = () => {
    mutate(
      { workspaceId, taskId },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
          toast({ title: "Success", description: data.message, variant: "success" });
          setTimeout(() => setOpenDialog(false), 100);
        },
        onError: (error) => {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        },
      }
    );
  };

  

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal />
            <span className="sr-only">abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {/* Edit Task Option */}
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpenEditDialog(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Editar Tarea
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setOpenMessageDialog(true)}
          >
            💬 Mensajes
          </DropdownMenuItem>


          {/* Delete Task Option */}
          <DropdownMenuItem
            className="!text-destructive cursor-pointer"
            onClick={() => setOpenDialog(true)}
          >
            Eliminar Tarea
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Task Dialog */}
      <EditTaskDialog task={task} isOpen={openEditDialog} onClose={() => setOpenEditDialog(false)} />

      {/* Delete Task Confirmation Dialog */}
      <ConfirmDialog
        isOpen={openDeleteDialog}
        isLoading={isPending}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleConfirm}
        title="Eliminar tarea"
        description={`estas seguro que quieres eliminar esta tarea ${taskCode}?`}
        confirmText="eliminar"
        cancelText="Cancelar"
      />
      
  <TaskMessagesDialog
    isOpen={openMessageDialog}
    onClose={() => setOpenMessageDialog(false)}
    workspaceId={workspaceId}
    otherUserId={task.assignedTo?._id || ""}
  />
    </>
    
  );
  
}
