# SaludCasaPorCasa

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## 📚 Guía Detallada de NestJS (Para Principiantes)

Si nunca has usado NestJS, esta sección te explicará cómo funciona este proyecto paso a paso. 

### 1. ¿Qué es NestJS?
NestJS es un framework para NodeJS. Piensa en él como un marco de trabajo que te obliga a mantener tu código ordenado. A diferencia de Express puro (donde puedes poner todo tu código en un solo archivo), NestJS utiliza **Arquitectura Modular**. Esto significa que cada funcionalidad de tu app (ej. Usuarios, Personal, Reportes) vive en su propio "Módulo" independiente.

---

### 2. Estructura de este Proyecto
Si miras dentro de la carpeta `src/`, verás algo como esto:

- `main.ts`: Es la puerta de entrada. Aquí es donde la aplicación "arranca" y escucha en el puerto configurado (ej. 3000).
- `app.module.ts`: Es el **Módulo Raíz**. Todos los demás módulos de la aplicación deben registrarse aquí para que Nest sepa que existen.
- `personal/`: Es un módulo de característica (*Feature Module*). Todo lo relacionado con el manejo del "Personal" vive aquí adentro.

---

### 3. El Flujo de Trabajo (¿Cómo viaja la información?)

Imagina que el Frontend hace una petición `POST /personal` para registrar a un nuevo trabajador. El flujo interno de NestJS es el siguiente:

1. **El Cliente (Frontend)** envía los datos en formato JSON.
2. **El DTO (`create-personal.dto.ts`)** actúa como guardia de seguridad. Revisa que el JSON tenga el formato correcto (ej. que el `nombre` sea texto y no esté vacío). Si los datos son incorrectos, rechaza la petición automáticamente con un error HTTP 400 (Bad Request).
3. **El Controlador (`personal.controller.ts`)** recibe la petición (ya validada por el DTO). Su único trabajo es decir: *"¡Hola! Recibí esto, se lo pasaré al servicio para que haga el trabajo pesado"*.
4. **El Servicio (`personal.service.ts`)** recibe los datos. Aquí vive la **Lógica de Negocio**. El servicio formatea datos, hace cálculos y le pide a la base de datos que guarde la información.
5. **La Entidad (`personal.entity.ts`)** le dice a la base de datos (PostgreSQL) cómo está estructurada la tabla para poder interactuar con ella.
6. **Respuesta:** El servicio guarda el dato usando TypeORM, se lo devuelve al controlador, y el controlador se lo envía al Frontend con un código de éxito (ej. `201 Created`).

---

### 4. Anatomía de los Componentes

#### 📦 A. Módulos (`module.ts`)
Son cajas que agrupan código. El archivo `personal.module.ts` junta el Controlador y el Servicio de Personal para que trabajen juntos. Además, importa la conexión a la tabla de la base de datos.
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Personal])], // Importamos la tabla a usar
  controllers: [PersonalController],               // Registramos el controlador
  providers: [PersonalService],                    // Registramos el servicio
})
export class PersonalModule {}
```

#### 🚦 B. Controladores (`controller.ts`)
Son los "enrutadores". Usan decoradores (palabras con `@`) para definir las URLs y métodos HTTP.
```typescript
@Controller('personal') // Define la ruta base: http://localhost:3000/personal
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}

  @Post() // Responde a POST /personal
  create(@Body() createPersonalDto: CreatePersonalDto) {
    return this.personalService.create(createPersonalDto); // Llama al servicio
  }
}
```

#### 🧠 C. Servicios (`service.ts`)
Son los "cerebros". Hacen el trabajo real. Deben tener el decorador `@Injectable()` para poder ser usados dentro del controlador.
```typescript
@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(Personal) // Inyecta la herramienta para hablar con la BD
    private readonly personalRepository: Repository<Personal>,
  ) {}

  async findAll() {
    return await this.personalRepository.find(); // Busca todo en la BD
  }
}
```

#### 💾 D. Entidades (`entity.ts`)
Son la representación de tus tablas de SQL en código (usando TypeORM).
```typescript
@Entity('personal') // Nombre de la tabla en SQL
export class Personal {
  @PrimaryGeneratedColumn() // Llave primaria autoincrementable
  id_persona: number;

  @Column({ type: 'varchar', length: 100 }) // Columna normal
  nombre: string;
}
```

#### 🛡️ E. DTOs (Data Transfer Objects)
Son reglas de validación. Usan la librería `class-validator`.
```typescript
export class CreatePersonalDto {
  @IsString()
  @IsNotEmpty()
  nombre: string; // Exige que el nombre sea un texto y no venga vacío
}
```

---

### 5. Atajos de Consola (Nest CLI)
Para no crear estos archivos a mano, usa la terminal. NestJS lo hace por ti:

- **Crear un CRUD completo de golpe (Recomendado):**
  `nest generate resource nombre_del_modulo` *(Selecciona REST API y dile que sí genere los endpoints)*
- Crear solo un módulo: `nest g mo nombre`
- Crear solo un controlador: `nest g co nombre`
- Crear solo un servicio: `nest g s nombre`

*(Asegúrate de ejecutar estos comandos estando dentro de la carpeta raíz del proyecto, donde está tu archivo `package.json`).*

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).