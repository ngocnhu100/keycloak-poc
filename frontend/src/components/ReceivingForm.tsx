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
  Divider,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  LogoutOutlined,
  InboxOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
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
        manufacturer_name: values.manufacturer_name,
        quantity_received: values.quantity_received,
        unit_of_measure: values.unit_of_measure,
        expiry_date: values.expiry_date.format("YYYY-MM-DD"),
        po_number: values.po_number,
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
      message.error(errorMsg);
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
    <div className="receiving-page">
      <div className="receiving-shell">
        <Card className="receiving-card">
          <div className="receiving-header">
            <div>
              <Title level={2} className="receiving-title">
                <InboxOutlined style={{ marginRight: 10 }} />
                Receiving Inventory
              </Title>
              <Text className="receiving-subtitle">
                Register incoming lots and capture audit trail details.
              </Text>
            </div>
            <Button
              type="primary"
              ghost
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>

          <div className="profile-card">
            <div>
              <Text className="section-title">Session</Text>
              <div className="profile-meta">
                <span className="meta-pill">
                  <UserOutlined />
                  {username}
                </span>
                <span className="meta-pill">
                  <SafetyCertificateOutlined />
                  {displayRoles || "None"}
                </span>
              </div>
            </div>
            <Text type="secondary">Authenticated via Keycloak</Text>
          </div>

          <Divider style={{ margin: "8px 0 24px" }} />

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
            label="Manufacturer Name"
            name="manufacturer_name"
            rules={[{ required: true, message: "Please enter manufacturer" }]}
          >
            <Input placeholder="e.g. Acme Pharma" />
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
            label="Unit of Measure"
            name="unit_of_measure"
            rules={[{ required: true, message: "Select unit" }]}
          >
            <Select
              placeholder="Select unit"
              options={[
                { value: "kg", label: "kg" },
                { value: "g", label: "g" },
                { value: "L", label: "L" },
                { value: "mL", label: "mL" },
                { value: "each", label: "each" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Expiration Date"
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

          <Form.Item label="PO Number" name="po_number">
            <Input placeholder="e.g. PO-12345" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Additional notes or observations" />
          </Form.Item>

            <Form.Item>
              <div className="form-actions">
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

                <Button
                  htmlType="button"
                  onClick={handleReset}
                  icon={<ReloadOutlined />}
                  size="large"
                  block
                >
                  Reset Form
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ReceivingForm;
