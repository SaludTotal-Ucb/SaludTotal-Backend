# Proyecto Integrador Salud Total
**Nombre de la estudiante:** Maria Belen Becerra Rivera
**Semestre:** Séptimo Semestre
**Carrera:** Ingeniería de Software
**Asignatura:** Computación en la Nube (ISW-341)
**Docente:** Ing. Fabrizio Gustavo Bellido Parra
**Universidad:** Universidad Católica Boliviana, Sede Santa Cruz

---

## 1. Ficha Técnica del Proyecto Base

El proyecto **Salud Total** es un sistema integral de gestión médica diseñado mediante una arquitectura desacoplada y principios de Clean Architecture. 

*   **Capa Backend (API):** Desarrollada con **NestJS (Node.js v20)**, utilizando TypeScript para garantizar seguridad de tipado. La capa de persistencia se maneja a través de **Prisma ORM**, conectándose a una base de datos relacional PostgreSQL.
*   **Capa Frontend (Cliente):** Aplicación SPA desarrollada con **React** y construida con **Vite**, consumiendo los servicios RESTful expuestos por el Backend.
*   **Flujos CRUD Médicos:**
    *   **Gestión de Citas:** Permite la creación (Agendar), lectura (Obtener por médico/paciente) y cancelación de citas médicas.
    *   **Historial Clínico:** CRUD para registrar, visualizar y actualizar los diagnósticos y tratamientos (Historial Médico) de los pacientes de forma segura y estructurada.

---

## 2. Definición de Arquitectura de Red y Nube

La infraestructura está desplegada bajo la "Ruta A" (AWS Learner Lab), adaptada para operar con un presupuesto inferior a $50 USD y bajo las restricciones de políticas de IAM (`LabRole`). La capa de cómputo se ha implementado de forma autogestionada sobre una instancia EC2 utilizando **K3s** (una distribución ligera de Kubernetes).

### Diagrama de Arquitectura (ASCII)

```text
                                       [ GitHub Actions CI/CD ]
                                                | (Push Image & SSH Deploy)
                                                v
+-----------------------------------------------------------------------------------+
|  AWS Cloud - us-east-1 (Learner Lab)                                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | VPC (Virtual Private Cloud)                                                 |  |
|  |                                                                             |  |
|  |  [ Internet Gateway ]                                                       |  |
|  |         |                                                                   |  |
|  |         v                                                                   |  |
|  |  +-------------------------------------+    +----------------------------+  |  |
|  |  | Public Subnet                       |    | Private/Data Subnet        |  |  |
|  |  |                                     |    |                            |  |  |
|  |  |  +-------------------------------+  |    |  +----------------------+  |  |  |
|  |  |  | EC2 Instance (t3.medium)      |  |    |  | AWS RDS (PostgreSQL) |  |  |  |
|  |  |  | (K3s Cluster - Auto-hosted)   |  |    |  | (db.t3.micro)        |  |  |  |
|  |  |  |                               |  |    |  |                      |  |  |  |
|  |  |  |  +-------------------------+  |  |    |  |                      |  |  |  |
|  |  |  |  |   SaludTotal Backend    |--|--|----|->| [ Database Tables ]  |  |  |  |
|  |  |  |  |   (Pods / ReplicaSet 2) |  |  |    |  |                      |  |  |  |
|  |  |  |  +-------------------------+  |  |    |  +----------------------+  |  |  |
|  |  |  |  | Service: ClusterIP      |  |  |    |                            |  |  |
|  |  |  |  | Ingress/NodePort        |  |  |    +----------------------------+  |  |
|  |  |  +-------------------------------+  |                                    |  |
|  |  +-------------------------------------+                                    |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
       ^
       |
[ Tráfico HTTP/REST desde Frontend (React) ]
```

---

### 3. Registro de Decisiones de Arquitectura (ADR)

#### ADR-001: Uso de K3s autohospedado en EC2 en lugar de Amazon EKS
* **Estado:** Aceptada
* **Contexto y Problema:** El entorno de AWS Academy Learner Lab prohíbe explícitamente la creación de nuevos roles IAM, lo cual es un requisito estricto para desplegar un clúster administrado con Amazon EKS. Además, el costo fijo por hora de EKS consumiría rápidamente el límite estricto de $50 USD del laboratorio.
* **Opciones Consideradas:** 1. Amazon EKS (Servicio administrado por AWS).
  2. K3s (Distribución ligera de Kubernetes) sobre una instancia EC2.
* **Decisión Tomada:** Implementar la **Opción 2** (K3s sobre instancia EC2 `t3.medium`).
* **Justificación:** K3s permite empaquetar, orquestar y escalar los contenedores de la aplicación "Salud Total" operando de forma nativa bajo el `LabInstanceProfile` preexistente. Esto evade las trabas administrativas de IAM, garantiza compatibilidad total con los manifiestos de Kubernetes (Deployment, Service, HPA) exigidos en la rúbrica, y mantiene el costo operativo alrededor de los $15 USD mensuales.
* **Consecuencias Positivas:** Control total del clúster, optimización extrema de costos y cumplimiento técnico del Pilar 1 sin violar políticas del Learner Lab.
* **Consecuencias Negativas:** Se asume la gestión manual del clúster y la carencia de alta disponibilidad nativa al operar en un esquema *Single-Node*.

#### ADR-002: Desacoplamiento de Base de Datos utilizando Supabase (BaaS) en lugar de AWS RDS
* **Estado:** Aceptada
* **Contexto y Problema:** Desplegar una base de datos transaccional dentro de los pods de Kubernetes (como un contenedor volátil) representa un riesgo crítico de pérdida de datos médicos. Por otro lado, aprovisionar un clúster de AWS RDS PostgreSQL sumaría costos adicionales que pondrían en riesgo el límite de presupuesto mensual del Learner Lab.
* **Opciones Consideradas:** 1. Base de datos PostgreSQL contenerizada en K3s con PersistentVolumes.
  2. AWS RDS for PostgreSQL.
  3. Supabase (PostgreSQL administrado como servicio - BaaS).
* **Decisión Tomada:** Implementar la **Opción 3** (Supabase).
* **Justificación:** Adoptar Supabase permite mantener la capa de persistencia 100% desacoplada de la capa de cómputo (cumpliendo el nivel Excelente del Pilar 1) sin consumir recursos de cómputo del servidor EC2 ni presupuesto de AWS. Supabase ofrece PostgreSQL administrado en la nube con un *free tier* generoso que soporta holgadamente la carga de la aplicación médica, aislando los datos de manera segura fuera de la instancia de EC2.
* **Consecuencias Positivas:** Ahorro total del presupuesto de base de datos en AWS, inyección directa de variables de entorno mediante secretos (`DATABASE_URL`), y alta disponibilidad de los datos.
* **Consecuencias Negativas:** Dependencia de red hacia un proveedor externo (Supabase) ajeno a la VPC de AWS.

---

## 4. Guía de Despliegue (Runbook)

Para aplicar las actualizaciones de forma manual en el clúster o verificar el estado post-despliegue, se deben seguir los siguientes pasos:

1.  **Conexión por SSH a la EC2 (K3s Control Plane):**
    ```bash
    ssh -i "clave_acceso.pem" ubuntu@<98.93.36.3>
    ```
2.  **Verificación de Nodos y Pods:**
    ```bash
    sudo k3s kubectl get nodes
    sudo k3s kubectl get pods -n default
    ```
3.  **Aplicación de Manifiestos (en caso de despliegue manual):**
    ```bash
    # Asegúrese de actualizar los valores en secrets.yaml (base64) primero.
    sudo k3s kubectl apply -f k8s/secrets.yaml
    sudo k3s kubectl apply -f k8s/backend-deployment.yaml
    sudo k3s kubectl apply -f k8s/hpa.yaml
    ```
4.  **Monitoreo del Escalado y Recursos:**
    ```bash
    sudo k3s kubectl get hpa
    sudo k3s kubectl logs -f deployment/saludtotal-backend
    ```

---

## 5. Reporte de Consumo y Costos (Presupuesto Mensual Estimado)

Para asegurar el cumplimiento de la restricción del Lab (>$50 USD), se configuró la infraestructura considerando las tarifas de la región `us-east-1` (Norte de Virginia).

| Servicio | Especificación | Uso Estimado | Costo Mensual Estimado (USD) |
| :--- | :--- | :--- | :--- |
| **Amazon EC2** | `t3.medium` (Linux, on-demand) - K3s Node | 730 horas/mes | ~$30.36 |
| **Amazon EBS** | 20 GB General Purpose SSD (gp3) | 20 GB/mes | ~$1.60 |
| **Amazon RDS** | PostgreSQL `db.t3.micro` (Single-AZ) | 730 horas/mes | ~$13.14 (Free tier elegible) |
| **Data Transfer**| Inbound/Outbound (Estimado bajo) | 5 GB/mes | ~$0.45 |
| **Total Estimado** | | | **~$45.55 USD / Mes** |

*Nota: El despliegue de EKS habría costado por sí solo $73 USD solo por el Control Plane, validando la viabilidad de la decisión (ADR-001).*

---

## 6. Pilares Seleccionados (Rúbrica)

Para la evaluación del proyecto, declaro explícitamente el enfoque en los siguientes dos pilares del marco de la asignatura:

*   **Pilar 1: Contenedores y Orquestación:** Implementación exitosa de Kubernetes (K3s), asegurando alta disponibilidad a través de ReplcaSets (2 pods mínimos), Service ClusterIP, configuración de Limits/Requests en el manifiesto y escalado dinámico (HPA al 70% CPU).
*   **Pilar 3: Automatización de Pipelines de Integración / Despliegue (CI/CD):** Desarrollo de un flujo semi-automático en GitHub Actions con validación de código (Prisma y 3 pruebas CRUD explícitas), construcción Docker multi-stage, escaneo de vulnerabilidades con `Trivy` y carga segura de artefactos en GitHub Container Registry (GHCR) con inyección automática de despliegue a la EC2.

---

## 7. Declaración de Failsafe de Seguridad

Declaro y certifico que **ninguna credencial, token, contraseña de base de datos o clave de acceso** se encuentra codificada en texto plano dentro del código fuente, manifiestos expuestos o archivos de configuración de este repositorio.

*   La cadena de conexión `DATABASE_URL` se administra exclusivamente mediante los `Secrets` nativos de Kubernetes (`k8s/secrets.yaml`), codificados en base64 y referenciados de manera segura como variables de entorno en el Deployment.
*   Las credenciales temporales de acceso a AWS IAM (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`) y las claves SSH se inyectan estrictamente en tiempo de ejecución de GitHub Actions mediante `workflow_dispatch inputs` y Secrets del repositorio, evitando cualquier brecha de seguridad.
