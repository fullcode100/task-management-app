import * as React from "react";
import { AxiosError } from "axios";
import { notification } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import moment from "moment";

import Block from "../components/common/Block";
import TaskForm, { TaskData } from "../components/task/TaskForm";
import { useAuth } from "../utils/auth";
import { createTask, getTask, updateTask } from "../api/task";
import dayjs from "dayjs";

const Context = React.createContext({ name: "Default" });

const TaskEditPage: React.FC = () => {
  useAuth();

  const params = useParams();

  const [task, setTask] = React.useState<API.TaskItem | undefined>();

  const [api, contextHolder] = notification.useNotification();
  const contextValue = React.useMemo(() => ({ name: "Ant Design" }), []);

  const action: string = params.id ? "Update" : "Create";

  const { data, isLoading, isSuccess, error } = useQuery<
    Promise<any>,
    AxiosError,
    API.CommonResp<API.TaskItem>,
    any
  >({
    queryKey: ["tasks", params.id],
    queryFn: () => getTask(params.id),
    enabled: !!params.id,
  });

  React.useEffect(() => {
    if (isSuccess && data && !task) {
      setTask({
        title: data.data.title,
        detail: data.data.detail,
        scheduled_date: new Date(data.data.scheduled_date),
      });
    }
    if (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("authtoken");
      }
    }
  }, [data, isLoading, isSuccess, error]);

  const saveTaskMutation = useMutation({
    mutationFn: (formData: API.TaskItem) => {
      if (params.id) return updateTask(params.id, formData);
      else return createTask(formData);
    },
    onSuccess: (response) => {
      api.success({ message: response.data.message, placement: "topRight" });
    },
  });

  const handleSubmit = (data: TaskData) => {
    data.scheduled_date = dayjs(data.scheduled_date);
    saveTaskMutation.mutate(data);
  };

  return (
    <Block>
      <Context.Provider value={contextValue}>
        {contextHolder}
        <TaskForm
          pending={saveTaskMutation.isLoading}
          onSubmit={handleSubmit}
          action={action}
          task={task}
        />
      </Context.Provider>
    </Block>
  );
};

export default TaskEditPage;
