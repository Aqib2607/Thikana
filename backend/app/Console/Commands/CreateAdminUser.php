<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\Console\Command\Command as SymfonyCommand;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     * Note: Password is intentionally excluded from CLI options to prevent exposure in process listings and history.
     *
     * @var string
     */
    protected $signature = 'admin:create
                            {--name= : The full name of the administrator}
                            {--email= : The email address of the administrator}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Provision a secure administrator account for the Thikana platform';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->components->info('Thikana Administrator Provisioning');

        // Resolve Administrator Role from static taxonomy
        $adminRole = Role::where('slug', 'admin')->first();
        if (! $adminRole) {
            $this->components->error("The 'admin' role does not exist in the database. Please run database seeders first.");

            return SymfonyCommand::FAILURE;
        }

        // 1. Gather and validate Administrator Name
        $name = (string) ($this->option('name') ?? $this->ask('Administrator full name'));
        $nameValidator = Validator::make(['name' => $name], [
            'name' => ['required', 'string', 'max:255'],
        ]);

        if ($nameValidator->fails()) {
            foreach ($nameValidator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return SymfonyCommand::FAILURE;
        }

        // 2. Gather and validate Administrator Email
        $email = (string) ($this->option('email') ?? $this->ask('Administrator email address'));
        $email = trim(strtolower($email));

        $emailValidator = Validator::make(['email' => $email], [
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        if ($emailValidator->fails()) {
            foreach ($emailValidator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return SymfonyCommand::FAILURE;
        }

        // 3. Strict Pre-existing Account Invariants
        /** @var User|null $existingUser */
        $existingUser = User::where('email', $email)->first();
        if ($existingUser !== null) {
            if ($existingUser->hasRole('admin')) {
                $this->components->error("An administrator account with email [{$email}] already exists. Creation aborted to prevent duplicate accounts.");
            } else {
                $this->components->error("A non-administrator user account with email [{$email}] already exists. Existing tenant/landlord accounts cannot be converted through this command.");
            }

            return SymfonyCommand::FAILURE;
        }

        // 4. Secure Hidden Password Entry
        $password = (string) $this->secret('Enter administrator password (minimum 8 characters)');
        if ($password === '') {
            $this->components->error('The administrator password cannot be empty.');

            return SymfonyCommand::FAILURE;
        }

        $passwordConfirmation = (string) $this->secret('Confirm administrator password');
        if ($password !== $passwordConfirmation) {
            $this->components->error('Password confirmation does not match.');

            return SymfonyCommand::FAILURE;
        }

        // 5. Validate Password Complexity
        $passwordValidator = Validator::make(['password' => $password], [
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($passwordValidator->fails()) {
            foreach ($passwordValidator->errors()->all() as $error) {
                $this->components->error($error);
            }

            return SymfonyCommand::FAILURE;
        }

        // 6. Atomic Database Persistence
        try {
            /** @var User $admin */
            $admin = DB::transaction(function () use ($name, $email, $password, $adminRole) {
                $user = new User([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make($password),
                ]);

                $user->role_id = $adminRole->id;
                $user->status = 'active';
                $user->email_verified_at = Carbon::now();
                $user->save();

                return $user;
            });

            Log::info("Administrator account provisioned via Artisan CLI: [ID: {$admin->id}, Email: {$admin->email}]");

            $this->components->success("Administrator [{$admin->name}] ({$admin->email}) successfully provisioned with ID [{$admin->id}].");

            return SymfonyCommand::SUCCESS;
        } catch (\Throwable $e) {
            Log::error("Failed to provision administrator account [{$email}]: ".$e->getMessage());
            $this->components->error('Database error occurred while provisioning administrator account. Check logs for details.');

            return SymfonyCommand::FAILURE;
        }
    }
}
