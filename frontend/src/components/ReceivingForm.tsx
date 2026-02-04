import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  message,
  Card,
  Select,
  Typography,
  Space,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useKeycloak } from "@react-keycloak/web";
import api from "../services/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Material {
  material_id: string;
  material_name: string;
  material_type: string;
  part_number: string;
}

/**
 * Receiving Form Component
 * Allows inventory managers to receive new inventory lots
 */
const ReceivingForm: React.FC = () => {
  const { keycloak, initialized } = useKeycloak();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const username = keycloak.tokenParsed?.preferred_username || "Unknown";
  const userRoles = keycloak.tokenParsed?.realm_access?.roles || [];
  const displayRoles = userRoles
    .filter((r) =>
      [
        "admin",
        "inventory_manager",
        "quality_control",
        "production",
        "viewer",
      ].includes(r),
    )
    .join(", ");

  // Fetch materials only after Keycloak is initialized and authenticated
  useEffect(() => {
    if (initialized && keycloak.authenticated && keycloak.token) {
      fetchMaterials();
    }
  }, [initialized, keycloak.authenticated]);

  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const response = await api.get("/inventory/materials");
      setMaterials(response.data.data);
    } catch (error: any) {
      message.error("Failed to load materials");
      console.error("Error fetching materials:", error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post("/inventory/lots", {
        material_id: values.material_id,
        quantity_received: values.quantity_received,
        expiry_date: values.expiry_date.format("YYYY-MM-DD"),
        supplier: values.supplier,
        manufacturer_lot: values.manufacturer_lot,
        storage_location: values.storage_location,
        notes: values.notes,
      });

      message.success(
        `Lot created successfully: ${response.data.data.lot_number}`,
      );
      form.resetFields();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create lot";
      message.error(`❌ ${errorMsg}`);
      console.error("Error creating lot:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: "0 20px" }}>
      <Card>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            📦 Receiving Inventory
          </Title>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Space>

        <div
          style={{
            marginBottom: 24,
            padding: 12,
            background: "#f0f2f5",
            borderRadius: 4,
          }}
        >
          <Text strong>👤 User: </Text>
          <Text>{username}</Text>
          <br />
          <Text strong>🎭 Roles: </Text>
          <Text>{displayRoles || "None"}</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Material"
            name="material_id"
            rules={[{ required: true, message: "Please select a material" }]}
          >
            <Select
              showSearch
              placeholder="Select material"
              loading={loadingMaterials}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={materials.map((m) => ({
                value: m.material_id,
                label: `${m.material_name} (${m.material_id})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Quantity Received"
            name="quantity_received"
            rules={[
              { required: true, message: "Please enter quantity" },
              {
                type: "number",
                min: 0.001,
                message: "Quantity must be greater than 0",
              },
            ]}
          >
            <InputNumber
              min={0.001}
              step={0.001}
              precision={3}
              style={{ width: "100%" }}
              placeholder="e.g. 100.500"
            />
          </Form.Item>

          <Form.Item
            label="Expiry Date"
            name="expiry_date"
            rules={[{ required: true, message: "Please select expiry date" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              disabledDate={(current) => {
                // Disable dates before today
                return current && current < dayjs().startOf("day");
              }}
            />
          </Form.Item>

          <Form.Item label="Supplier" name="supplier">
            <Input placeholder="Supplier name" />
          </Form.Item>

          <Form.Item label="Manufacturer Lot Number" name="manufacturer_lot">
            <Input placeholder="Manufacturer's lot number" />
          </Form.Item>

          <Form.Item label="Storage Location" name="storage_location">
            <Input placeholder="e.g. COLD-A-01, ROOM-B-05" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Additional notes or observations" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
              block
            >
              Create Lot
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              htmlType="button"
              onClick={handleReset}
              icon={<ReloadOutlined />}
              size="large"
              block
            >
              Reset Form
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ReceivingForm;
